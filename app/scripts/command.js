var cmd = require('node-cmd');
let os = require('os')
var pathlib = require('path')
var fs = require('fs');
// const ipcMain = require('electron').ipcMain;
// const {dialog, BrowserWindow } = require('electron')
// const path = require('path')

// var homedir = os.userInfo().homedir
var backFolder = []
var forwardFolder =[]
// checkForFolderHistory()

var jsonObjGlobal = {
  "code": {
    'submission.xlsx': null,
    'empty_directory': {
      'subm.xlsx':null
    }
  },
  "derivatives": {},
  "primary": {
    'dataset_desc.xlsx': null,
    'dataset_description.xlsx': null},
  "source": {
    'empty-directory': {}
  },
  "docs": {},
  "protocols": {},
  "submission.xlsx": null,
  "dataset_description.xlsx": null,
  "README.txt": null
}

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("add-folders")

/// back button
backButton.addEventListener("click", function() {
  console.log("after Back:" + globalPath.value)
  event.preventDefault();
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });

  globalPath.value = "/" + filtered.slice(0,filtered.length-1).join("/")
  var myPath = jsonObjGlobal;
  for (var item of filtered.slice(0,filtered.length-1)) {
    myPath = myPath[item]
  }

  var appendString = ""
  for (var item in myPath) {
    if (!myPath[item]) {
      appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
    }
    else {
      // folderID = folder + "-" + item
      appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
    }
  }

  /// empty the div
  $('#items').empty()
  $('#items').html(appendString)

  // get back the div and child elements of the new div (reconstruct)
  listItems(myPath)
  getInFolder()
  event.preventDefault();
})

// Add folder button
addNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  var appendString = '';
  // var folderID = '';
  appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div contentEditable="true" id="new-folder" class="folder_desc">New folder</div></div>'
  $(appendString).appendTo('#items');

  /// update jsonObjGlobal
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });

  // console.log(appendString)
  var renamedNewFolder = "New folder"

  var myPath = jsonObjGlobal;
  for (var item of filtered) {
    myPath = myPath[item]
  }

  myPath[renamedNewFolder] = {}
  console.log(jsonObjGlobal)
})

//  rename
function renameFolder(renamedNewFolder) {
  // renamedNewFolder = ""

  var myPath = jsonObjGlobal;
  for (var item of filtered) {
    myPath = myPath[item]
  }

  myPath[renamedNewFolder] = {}
  console.log(jsonObjGlobal)
}

//
// $( ".single-item" ).keydown(function() {
//   var renamedNewFolder;
//   renamedNewFolder = $( this ).val();
//   $( event.target ).children()
//   // $("#new-folder").attr("id", filtered.join("-") + "-" + renamedNewFolder);
//   renameFolder(renamedNewFolder)
// })
// .keyup();

// /////

listItems(jsonObjGlobal)
//
// function loadpath(jsonObj) {
//   listItems(jsonObj);
// }

//
// function checkForFolderHistory() {
//     if(backFolder.length === 0) {
//         $('#back').prop('disabled', true)
//     }
//     if(forwardFolder.length === 0) {
//         $('#forward').prop('disabled', true)
//     }
// }

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  var itemName = ev.dataTransfer.files[0].name
  var itemType = ev.dataTransfer.types
  var duplicate = false

  // check for duplicate or files with the same name
  for (var i=0; i<ev.target.children.length;i++) {
    if (itemName === ev.target.children[i].innerText) {
      duplicate = true
      break
    }
  }

  /// check for File, not allowed Folder drag and drop for now
  if (itemType[0] === "Files") {
    if (duplicate) {
      alert('Duplicate file name!')
    } else {
        var currentPath = globalPath.value
        var jsonPathArray = currentPath.split("/")
        var filtered = jsonPathArray.filter(function (el) {
          return el != "";
        });
        var myPath = jsonObjGlobal;
        for (var item of filtered) {
          myPath = myPath[item]
        }
        myPath[ev.dataTransfer.files[0].name] = ev.dataTransfer.files[0].path
        var myspan = "<span style='display: none' id='myspan'>' + ev.dataTransfer.files[0].path + '</span>"
        var appendString = '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+ev.dataTransfer.files[0].name+'</div></div>'
        $(appendString).appendTo(ev.target);
    }
  } else {
      alert('Folders are not allowed to be dropped in this area!')
  }
}

///////////////////////////////////////////////////////////////////////////////////////
// This is to rename a folder, will need to move this to Context menu once create it. //
// $('.folder_desc').attr('contenteditable','true')
/// then update the Json structure: grab global path, then same logic to change the key name.
///////////////////////////////////////////////////////////////////////////////////////

function getInFolder() {
  $('.single-item').dblclick(function(){
    if($(this).children("h1").hasClass("blue")) {
      var folder = this.id
      // var folderID = ''
      var appendString = ''
      globalPath.value = globalPath.value + folder + "/"
      console.log(globalPath.value)

      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      console.log(filtered)
      var myPath = jsonObjGlobal;
      for (var item of filtered) {
        myPath = myPath[item]
      }

      for (var item in myPath) {
        console.log(item)
        if (!myPath[item]) {
          appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
        }
        else {
          // folderID = folder + "-" + item
          appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
        }

      }

      $('#items').empty()
      $('#items').html(appendString)


      listItems(myPath)
      getInFolder()

    } else {
      alert("Please click on a folder to explore!")
    }
  })
}

getInFolder()

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

        for (var item in jsonObj) {
          if (!(item in ["code", "primary", "derivatives", "source", "docs", "protocols"])) {
            if (!jsonObj[item]) {
              appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
            else {
              folderID = item
              appendString = appendString + '<div class="single-item" id=' + folderID + '><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
          }
        }

        $('#items').empty()
        $('#items').html(appendString)


        // $('div.folder_desc').dblclick(function(){
        //     if($(this).children("h1").hasClass("blue")) {
        //         $('.folder_desc').attr('contenteditable','true');
        //     }
        //   })
  }
