var currentTab = null;

function setPasswordColors(foreground, background) {
    $("#generated").css("background-color", background);
    $("#generated").css("color", foreground);        
    $("#password").css("background-color", background);
    $("#password").css("color", foreground);        
}

function getAutoProfileIdForUrl(url) {
    var profiles = Settings.getProfiles();
    for (var i in profiles) {
        var profile = profiles[i];
        if (profile.siteList) {
            var usedText = profile.getUrl(url);
            var sites = profile.siteList.split(' ');
            for (var j = 0; j < sites.length; j++) {
                var pat = sites[j];

                if (pat[0] == '/' && pat[pat.length-1] == '/') {
                    pat = pat.substr(1, pat.length-2);
                } else {
                    pat = pat.replace(/[$+()^\[\]\\|{},]/g, '');
                    pat = pat.replace(/\?/g, '.');
                    pat = pat.replace(/\*/g, '.*');
                }

                if (pat[0] != '^') pat = '^' + pat;
                if (pat[pat.length-1] != '$') pat = pat + '$';

                var re;
                try {
                    re = new RegExp(pat);
                } catch(e) {
                    console.log(e + "\n");
                }

                if (re.test(usedText) || re.test(url)) {
                    return profile.id;
                }
            }
        }
    }
    return null;
}

function updateFields(e) {
    var password = $("#password").val();
    var usedtext = $("#usedtext").val();
    
    var profileId = $("#profile").val();
    if (profileId == "auto") {
        profileId = getAutoProfileIdForUrl(usedtext);        
    } else {
        Settings.setActiveProfileId(profileId);
    }
    var profile = Settings.getProfile(profileId);

    Settings.setStoreLocation($("#store_location").val());
    Settings.setPassword(password);
    
    var enableCopy = false;

    if (password == "") {
        $("#generatedForClipboard").val("");
        $("#generated").val("Enter password");
        setPasswordColors("#000000", "#efefef")
    } else if ( ! matchesHash(password) ) {
        $("#generatedForClipboard").val("");
        $("#generated").val("Master password mismatch");
        setPasswordColors("#000000", "#ffc9bb")
    } else {        
        if (profile != null) {
            var generatedPassword = profile.getPassword($("#usedtext").val(), password);
            $("#generated").val(generatedPassword);
            $("#generatedForClipboard").val(generatedPassword);
            enableCopy = true;
        } else {
            $("#generated").val("");
            $("#generatedForClipboard").val("");
        }
        setPasswordColors("#000000", "#FFFFFF")
    }
    if (enableCopy) {
        showCopy();
    } else {
        hideCopy();
    }
}

function matchesHash(password) {
  if (!Settings.keepMasterPasswordHash()) return true;
  var saved_hash = Settings.masterPasswordHash();
  var new_hash = ChromePasswordMaker_SecureHash.make_hash(password);
  return new_hash == saved_hash ;
}

function updateUsedText(url) {
    var profileId = $("#profile").val();
    if (profileId == "auto") {
        profileId = getAutoProfileIdForUrl(url);        
    }
    var profile = Settings.getProfile(profileId);
    $("#usedtext").val(profile.getUrl(url));
}

function onProfileChanged() {
    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            updateUsedText(tab.url);
            updateFields();
        });
    });
}

function showInject() {
    $("#injectpasswordrow").fadeIn();
}

function hideCopy() {
  $("#copypassword").hide();
}

function showCopy() {
  $("#copypassword").fadeIn();
}

function init(url) {
    Settings.getPassword(function(password) {
        $("#password").val(password);

        var activeProfileId = Settings.getActiveProfileId();    
        var autoProfileId = getAutoProfileIdForUrl(url);
        
        var options = "";
        var profiles = Settings.getProfiles();
        for (var i in profiles) {
            var profile = profiles[i];
            if (autoProfileId && profile.id == autoProfileId) {
                options += "<option value='auto' selected='true'";
            } else if (!autoProfileId && profile.id == activeProfileId) {
                options += "<option value='"+profile.id+"' selected='true'";          
            } else {
                options += "<option value='"+profile.id+"'";             
            }
            options += ">"+profile.title+"</option>";
        }

        $("#profile").empty().append(options);

        updateUsedText(url);
        $("#store_location").val(Settings.storeLocation);

        updateFields();

        chrome.tabs.sendRequest(currentTab, {hasPasswordField: true}, function(response) {
            if (response.hasField) {
                showInject();
            }
        });

        password = $("#password").val();
        if (password == null || password.length == 0) {
            $("#password").focus();
        } else {
            $("#generated").focus();
        }
    });
}

function fillPassword() {
    chrome.tabs.sendRequest(currentTab, {password: $("#generated").val()});
    window.close();
}

function copyPassword() {
    $("#generatedForClipboard").select();
    document.execCommand("Copy");
    window.close();
}

function openOptions() {
    chrome.tabs.create({url: 'html/options.html'});
    window.close();
}

function showPasswordField() {
    $("#activatePassword").hide();
    $("#generated").show();
    $("#generated").focus();
}

$(function() {
    $("#password").bind('keyup change', updateFields);
    $("#usedtext").bind('keyup change', updateFields);
    $("#store_location").bind('change', updateFields);
    $("#profile").bind('change', onProfileChanged);
    $("#activatePassword").bind('click', showPasswordField);
    $("#copypassword>input").bind('click', copyPassword);
    $("#injectpasswordrow>input").bind('click', fillPassword);
    $("#options>a").bind('click', openOptions);

    $("#injectpasswordrow").hide();
    $("#copypassword").hide();

    if (Settings.shouldHidePassword()){
        $("#generated").hide();
        $("#activatePassword").show();
    } else {
        $("#generated").show();
        $("#activatePassword").hide();
    }

    if (Settings.keepMasterPasswordHash()) {
        var saved_hash = Settings.masterPasswordHash();
        if(saved_hash.charAt(0) != 'n') {
            saved_hash = ChromePasswordMaker_SecureHash.update_old_hash(saved_hash);
            Settings.setMasterPasswordHash(saved_hash);
        }
    }

    $("#generated").keypress(function(event) {
      if (event.keyCode == 13) {
            chrome.tabs.sendRequest(currentTab, {hasPasswordField: true}, function(response) {
                if (response.hasField) {
                    fillPassword();
                }
            });
      }
    });
    
    chrome.windows.getCurrent(function(obj) {
        chrome.tabs.getSelected(obj.id, function(tab) {
            currentTab = tab.id;
            init(tab.url);
            $("form").show();
        });
    });
    
  // Focus hack, see http://stackoverflow.com/a/11400653/1295557
  if (location.search != "?focusHack") location.search = "?focusHack";
  
  // Tab navigation workaround, see http://code.google.com/p/chromium/issues/detail?id=122352
  // Use Enter instead of Tab
  $("#password").keypress(function(event) {
    if (event.keyCode == 13) {
      chrome.tabs.sendRequest(currentTab, {hasPasswordField: true}, function(response) {
        if (response.hasField) {
          fillPassword();
        }
      });
    }
    
  });
});
