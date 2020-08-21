var cmd = require('node-cmd');
let os = require('os')
var path = require('path')
var fs = require('fs');
var $ = require('jquery');
const prompt = require('electron-prompt');
const {ipcRenderer} = require('electron')
const dialog = require('electron').remote.dialog
const electron = require('electron')

var backFolder = []
var forwardFolder =[]

var jsonObjGlobal = {
  "code": {
    'empty_directory': {
    }
  },
  "derivative": {},
  "primary": {},
  "source": {
    'empty-directory': {}
  },
  "docs": {},
  "protocols": {},
  "dataset_description.xlsx": "C:/mypath/folder1/sub-folder-1/dataset_description.xlsx",
}

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("new-folder")
const addFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
var fullPathValue = document.querySelector(".hoverText")


function getGlobalPath() {
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered
}


//////////////////////////////////////////////////////////////////////////////
///// FILE BROWSERS ADD FILES & FOLDERS //////////////////////////////////////

addFiles.addEventListener("click", function() {
   dialog.showOpenDialog({ properties: ['openFile', 'multiSelections']
 }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFilesfunction(result.filePaths, myPath)
  })
})

addFolders.addEventListener("click", function() {
  dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections']
  }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFoldersfunction(result.filePaths, myPath)
  })
})

function addFoldersfunction(folderArray, currentLocation) {

  // check for duplicates/folders with the same name
    for (var i=0; i<folderArray.length;i++) {
      var baseName = path.basename(folderArray[i])
      var duplicate = false;
      for (var objKey in currentLocation) {
        if (typeof currentLocation[objKey] === "object") {
          if (baseName === objKey) {
            duplicate = true
            break
          }
        }
      }
      if (duplicate) {
        alert('Duplicate folder name: ' + baseName)
      } else {

        currentLocation[baseName] = {}
        populateJSONObjFolder(currentLocation[baseName], folderArray[i])

        var appendString = '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation)
        getInFolder()
      }
    }
}

function addFilesfunction(fileArray, currentLocation) {

  // check for duplicate or files with the same name
    for (var i=0; i<fileArray.length;i++) {
      var baseName = path.basename(fileArray[i])
      var duplicate = false;
      for (var objKey in currentLocation) {
        if (typeof currentLocation[objKey] !== "object") {
          if (baseName === objKey) {
            duplicate = true
            break
          }
        }
      }
      if (duplicate) {
        alert('Duplicate file name: ' + baseName)
      } else {
        // if (itemName!==)

        currentLocation[baseName] = fileArray[i]
        var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation)
        getInFolder()
      }
    }
}

//////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////
///// CONTEXT MENU OPTIONS
//////////////////////////////////////////////////////////////////////////////


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


function renameFolder(event1) {

  var promptVar;
  var type;
  var newName;
  var currentName = event1.parentElement.parentElement.innerText
  var withoutExtension;

  if (event1.classList.value === "fas fa-file") {
    promptVar = "file";
    type = "file";
  } else if (event1.classList.value === "fas fa-folder") {
    promptVar = "folder";
    type = "folder";
  }

  if (type==="file") {
    withoutExtension = currentName.slice(0,currentName.indexOf("."))
  } else {
    withoutExtension = currentName
  }

  // show input box for new name
  prompt({
    title: 'Renaming '+ promptVar + " " + currentName +': ...',
    label: 'Enter a new name:',
    value: withoutExtension,
    inputAttrs: {
      type: 'text'
    },
    type: 'input'
  })
  .then((r) => {
    if(r !== null && r!== "") {
      if (type==="file") {
        newName = r.trim() + currentName.slice(currentName.indexOf("."))
      } else {
        newName = r.trim()
      }

      /// assign new name to folder in the UI
      event1.parentElement.parentElement.innerText = newName

      /// update jsonObjGlobal with the new name
      /// get current location first
      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      // updating object
      var myPath = getRecursivePath(filtered)
      storedValue = myPath[currentName]
      delete myPath[currentName];
      myPath[newName] = storedValue

      listItems(myPath)
      getInFolder(myPath)
      console.log(myPath)
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
///////////////////////////////////////////////////////////////////////////////

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

// ///////////////////////////////////////////////////////////////////////////

listItems(jsonObjGlobal)

function populateJSONObjFolder(jsonObject, folderPath) {
    var myitems = fs.readdirSync(folderPath)
    myitems.forEach(element => {
      var statsObj = fs.statSync(path.join(folderPath, element))
      var addedElement = path.join(folderPath, element)
      if (statsObj.isDirectory()) {
        jsonObject[element] = {}
        populateJSONObjFolder(jsonObject[element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject[element] = addedElement
        }
    });
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  // get global path
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered)
  ev.preventDefault();

  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path
    var itemName = ev.dataTransfer.files[i].name
    var duplicate = false

    var statsObj = fs.statSync(itemPath)

    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }

    /// check for File, not allowed Folder drag and drop for now
    if (statsObj.isFile()) {
      if (globalPath.value === "/") {
        if (duplicate) {
          alert('Duplicate file name: ' + itemName)
        } else {
            if (!["dataset_description.xlsx", "submission.xlsx", "samples.xlsx", "subjects.xlsx", "README.txt"].includes(itemName)) {
              alert("Only metadata files can be added to this level!")
            } else {
              myPath[itemName] = itemPath

              var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);

              listItems(myPath)
              getInFolder()
            }
        }
      } else {
          myPath[itemName] = itemPath

          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      if (globalPath.value === "/") {
        alert("Other folders cannot be added to this level!")
      } else {
        if (duplicate) {
          alert('Duplicate folder name: ' + itemName)
        } else {
          var currentPath = globalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered)

          var folderJsonObject = {};

          populateJSONObjFolder(folderJsonObject, itemPath)

          myPath[itemName] = folderJsonObject

          var appendString = '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    }
  }
}

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
