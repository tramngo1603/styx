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
  "submission.xlsx": "C:/mypath/folder1/sub-folder-1/submission.xlsx",
  "dataset_description.xlsx": "C:/mypath/folder1/sub-folder-1/dataset_description.xlsx",
  "README.txt": "C:/mypath/folder1/sub-folder-1/README.txt"
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
    if ($(this).attr('id') === "rename") {
        renameFolder(event)
      } else if ($(this).attr('id') === "delete") {
        delFolder(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu()
 });
 hideMenu()
}


// ////////////////////////////////////////////////////////////////////////////
// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {

    // Avoid the real one
    event.preventDefault();

    // Show contextmenu
    showmenu(event)
});


// If the document is clicked somewhere
document.addEventListener('contextmenu', function(e){
  if (e.target.classList.value !== "fas fa-folder" && e.target.classList.value !== "fas fa-file") {
    hideMenu()
  } else {
    showmenu(e)
  }
});

// If the document is clicked somewhere
document.addEventListener('click', function(e){
  if (e.target.classList.value !== "fas fa-folder" && e.target.classList.value !== "fas fa-file") {
    hideMenu()
    hideFullPath()
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
      var newName = r.trim()
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
    }
  })
  .catch(console.error);
}

function delFolder(event2) {

  var itemToDelete = event2.parentElement.parentElement.innerText

  /// update jsonObjGlobal
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (element) {
    return element != "";
  });

  var myPath = getRecursivePath(filtered)

  // update Json object with new folder created
  delete myPath[itemToDelete];

  listItems(myPath)
  getInFolder(myPath)
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

function showFullPath(ev, text) {
  ev.preventDefault()
  fullPathValue.style.display = "block";
  fullPathValue.innerHTML = text
  fullPathValue.style.top = `${ev.clientY - 10}px`;
  fullPathValue.style.left = `${ev.clientX + 15}px`;
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
        newFolderName = r.trim()
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

// /////

listItems(jsonObjGlobal)

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    var itemPath = ev.dataTransfer.files[i].path
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
        alert('Duplicate file name: ' + itemName)
      } else {
        var currentPath = globalPath.value
        var jsonPathArray = currentPath.split("/")
        var filtered = jsonPathArray.filter(function (el) {
          return el != "";
        });

        var myPath = getRecursivePath(filtered)

        var filePath = ev.dataTransfer.files[i].path
        myPath[itemName] = filePath

        var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
        $(appendString).appendTo(ev.target);

        listItems(myPath)
        getInFolder()
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
  })
}

var fullPathValue = document.querySelector(".hoverText")

function hideFullPath() {
  fullPathValue.style.display = "none";
  fullPathValue.style.top = '-210%';
  fullPathValue.style.left = '-210%';
}

/// hover for a full path
function hoverForPath(ev) {
    $(ev).unbind()
    var currentPath = globalPath.value
    var jsonPathArray = currentPath.split("/")
    var filtered = jsonPathArray.filter(function (el) {
      return el != "";
    });

    var myPath = getRecursivePath(filtered)

    // get full path from JSON object
    var fullPath = myPath[ev.innerText]
    showFullPath(event, fullPath)
}


// If the document is clicked somewhere
document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value !== "fas fa-file") {
    hideFullPath()
  } else {
    hoverForPath(e)
  }
});


getInFolder()

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

        for (var item in jsonObj) {
          if (!(item in ["code", "primary", "derivatives", "source", "docs", "protocols"])) {
            if (typeof jsonObj[item] !== "object") {
              appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i oncontextmenu="myFunction(this)" class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
            else {
              folderID = item
              appendString = appendString + '<div class="single-item" id=' + folderID + '><h1 class="folder blue"><i oncontextmenu="myFunction(this)" class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
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
