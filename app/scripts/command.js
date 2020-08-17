var cmd = require('node-cmd');
let os = require('os')
var pathlib = require('path')
var fs = require('fs');
var $ = require('jquery');
const prompt = require('electron-prompt');

var backFolder = []
var forwardFolder =[]

var jsonObjGlobal = {
  "code": {
    'submission.xlsx': null,
    'empty_directory': {
      'subm.xlsx':null
    }
  },
  "derivative": {},
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
const contextMenu = document.getElementById("mycontext")

let menu = null;
menu = document.querySelector('.menu');

function myFunction(event) {

  $(".menu li").unbind().click(function(){
    switch ($(this).attr('id')) {
      case "rename":
        renameFolder(event)

      case "delete":
        console.log($(this));
    }
     // Hide it AFTER the action was triggered
     hideMenu()
 });
}


// ////////////////////////////////////////////////////////////////////////////
// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {

    // Avoid the real one
    event.preventDefault();

    // Show contextmenu
    showmenu(event)
    // $(".menu").finish().toggle(100).
    //
    // // In the right position (the mouse)
    // css({
    //     top: event.pageY + "px",
    //     left: event.pageX + "px"
    // });
});


// If the document is clicked somewhere
document.addEventListener('contextmenu', function(e){
  if (e.target.classList.value !== "fas fa-folder" && e.target.classList.value !== "fas fa-file") {
    hideMenu()
  } else {
    showmenu(e)
  }
});

// ////////////////////////////////////////////////////////////////////////////


function renameFolder(event1) {
  var currentFolderName = event1.parentElement.parentElement.innerText

  // show input box for new name
  prompt({
    title: 'Renaming folder '+ currentFolderName +': ...',
    label: 'Enter a new name:',
    value: currentFolderName,
    inputAttrs: {
      type: 'text'
    },
    type: 'input'
  })
  .then((r) => {
    if(r !== null && r!== "") {
      var newName = r
      event1.parentElement.parentElement.innerText = newName

      /// update jsonObjGlobal
      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      var myPath = getRecursivePath(filtered)

      // update Json object with new folder created
      storedValue = myPath[currentFolderName]
      delete myPath[currentFolderName];
      myPath[newName] = storedValue

      listItems(myPath)
      getInFolder(myPath)
      console.log("rename")
    }
  })
  .catch(console.error);
}

function delFolder(event2) {
  console.log("deleting" + event2)
}

function showmenu(ev){
    //stop the real right click menu
    ev.preventDefault();
    //show the custom menu
    // menu.classList.remove('off');
    menu.style.display = "block";
    menu.style.top = `${ev.clientY - 10}px`;
    menu.style.left = `${ev.clientX + 15}px`;
}

function hideMenu(){
  menu.style.display = "none";
  menu.style.top = '-200%';
  menu.style.left = '-200%';
}

function loadFileFolder(myPath) {
  var appendString = ""
  for (var item in myPath) {
    if (!myPath[item]) {
      appendString = appendString + '<li><div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div></li>'
    }
    else {
      appendString = appendString + '<li><div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div></li>'
    }
  }
  return appendString
}

function getRecursivePath(filteredList) {
  var myPath = jsonObjGlobal;
  for (var item of filteredList) {
    myPath = myPath[item]
  }
  return myPath
}

/// back button
backButton.addEventListener("click", function() {
  event.preventDefault();
  var currentPath = globalPath.value

  if (currentPath !== "/") {
    var jsonPathArray = currentPath.split("/")
    var filtered = jsonPathArray.filter(function (el) {
      return el != "";
    });

    if (filtered.length === 1) {
      globalPath.value = "/"
    } else {
      globalPath.value = "/" + filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = jsonObjGlobal;
    for (var item of filtered.slice(0,filtered.length-1)) {
      myPath = myPath[item]
    }

    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // get back the div and child elements of the new div (reconstruct)
    listItems(myPath)
    getInFolder()
  }
})

// Add folder button
addNewFolder.addEventListener("click", function(event) {
  event.preventDefault();

  if(globalPath.value!=="/") {
    var newFolderName = "New Folder"
    // show input box for name

    prompt({
      title: 'Adding a new folder...',
      label: 'Enter a name for the new folder:',
      value: "",
      inputAttrs: {
        type: 'text'
      },
      type: 'input'
    })
    .then((r) => {
      if(r !== null && r!== "") {
        newFolderName = r
        var appendString = '';
        // var folderID = '';
        appendString = appendString + '<li><div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div contentEditable="true" id="new-folder" class="folder_desc">'+ newFolderName +'</div></div></li>'
        $(appendString).appendTo('#items');

        /// update jsonObjGlobal
        var currentPath = globalPath.value
        var jsonPathArray = currentPath.split("/")
        var filtered = jsonPathArray.filter(function (el) {
          return el != "";
        });

        var myPath = getRecursivePath(filtered)

        // update Json object with new folder created
        var renamedNewFolder = newFolderName
        myPath[renamedNewFolder] = {}

        listItems(myPath)
        getInFolder()
      }
    })

    .catch(console.error);
  } else {
      alert("New folders cannot be added at this level!")
  }

})

// //  rename
// function renameFolder(renamedNewFolder) {
//   // renamedNewFolder = ""
//
//   var myPath = jsonObjGlobal;
//   for (var item of filtered) {
//     myPath = myPath[item]
//   }
//
//   myPath[renamedNewFolder] = {}
// }

// /////

listItems(jsonObjGlobal)

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    var itemName = ev.dataTransfer.files[i].name
    var itemType = ev.dataTransfer.files[i].size
    var duplicate = false

    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }

    /// check for File, not allowed Folder drag and drop for now
    if (itemType !== 0) {
      if (duplicate) {
        alert('Duplicate file name!')
      } else {
        var currentPath = globalPath.value
        var jsonPathArray = currentPath.split("/")
        var filtered = jsonPathArray.filter(function (el) {
          return el != "";
        });

        var myPath = getRecursivePath(filtered)

        // ev.dataTransfer.files[0].path
        myPath[itemName] = null
        // var myspan = "<span style='display: none' id='myspan'>' + ev.dataTransfer.files[0].path + '</span>"
        var appendString = '<li><div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div></li>'
        $(appendString).appendTo(ev.target);
      }
    } else {
      alert('Folders are not allowed to be dropped in this area!')
    }
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
      var appendString = ''
      globalPath.value = globalPath.value + folder + "/"

      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      var myPath = getRecursivePath(filtered)

      var appendString = loadFileFolder(myPath)

      $('#items').empty()
      $('#items').html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath)
      getInFolder()

    } else {
        alert("Please click on a folder to explore!")
    }
    console.log("Current path: " + globalPath.value)
  })
}

getInFolder()

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

        for (var item in jsonObj) {
          if (!(item in ["code", "primary", "derivatives", "source", "docs", "protocols"])) {
            if (!jsonObj[item]) {
              appendString = appendString + '<div class="single-item"><h1 class="folder file"><i  oncontextmenu="myFunction(this)" class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
            else {
              folderID = item
              appendString = appendString + '<div class="single-item" id=' + folderID + '><h1 class="folder blue"><i  oncontextmenu="myFunction(this)" class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
          }
        }

        $('#items').empty()
        $('#items').html(appendString)
  }

  /// Rename a file
function renameFile() {
  $('div.folder_desc').dblclick(function(){
        if($(this).children("h1").hasClass("blue")) {
              $('.folder_desc').attr('contenteditable','true');
          }
      })
}
