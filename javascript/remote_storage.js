RemoteStorage = {}

RemoteStorage.url = function() {
  return Settings.getRemoteProfileUrl();
}

RemoteStorage.set = function(data, callback) {
  jQuery.ajax({
    type: "POST",
    url: RemoteStorage.url(),
    dataType: 'json',
    async: false,
    data: data,
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
  data = {}
  jQuery.ajax({
    type: "GET",
    url: RemoteStorage.url(),
    dataType: 'json',
    async: false,
    success: function (response){
      if(response.success == true){
        data = response['data']
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