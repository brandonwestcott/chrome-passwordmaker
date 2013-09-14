RemoteStorage = {}

RemoteStorage.url = function() {
  return Settings.getRemoteProfileUrl();
}

RemoteStorage.set = function(data, callback) {
  post_data = {
    "profiles": JSON.parse(JSON.stringify(data)),
  }
  console.log(data);
  jQuery.ajax({
    type: "POST",
    url: RemoteStorage.url(),
    dataType: 'json',
    async: false,
    data: post_data,
    success: function (resp){
      callback(resp);
    },
    error: function(error) {
      if(typeof(safeAlert) == "function"){
        safeAlert('Could not save remote profiles - ' + error.statusText);
      }
    }    
  });
}

RemoteStorage.get = function() {
  data = []
  jQuery.ajax({
    type: "GET",
    url: RemoteStorage.url(),
    dataType: 'json',
    async: false,
    success: function (response){
      if(response.success == true){
        data = response['data']['profiles']
      }
    },
    error: function(error) {
      if(typeof(safeAlert) == "function"){
        safeAlert('Could not get remote profiles - ' + error.statusText);
      }
    }
  });
  return data;
}