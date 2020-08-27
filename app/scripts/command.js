const os = require('os');
const path = require('path');
const fs = require('fs');
const $ = require('jquery');
const prompt = require('electron-prompt');
const {ipcRenderer} = require('electron')
const dialog = require('electron').remote.dialog
const electron = require('electron')
const bootbox = require('bootbox')

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
  // any file's value is a list [full_path, added description, added metadata, boolean to "Apply description to all files in the folder", boolean to “Apply additional metadata to all files in the folder"]
  "dataset_description.xlsx": ["C:/mypath/folder1/sub-folder-1/dataset_description.xlsx", "description-example", "additional-metadata-example", "Yes", "No"],
}

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("new-folder")
const addFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
var fullPathValue = document.querySelector(".hoverPath")
var fullNameValue = document.querySelector(".hoverFullName")



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

  if (globalPath.value === "/") {
    alert("Additional folders cannot be added to this level!")
  } else {

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

        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation)
        getInFolder()
      }
    }
  }
}

function addFilesfunction(fileArray, currentLocation) {

  // check for duplicate or files with the same name
    for (var i=0; i<fileArray.length;i++) {
      var baseName = path.basename(fileArray[i])

      if (globalPath.value === "/" && (!["dataset_description.xlsx", "dataset_description.csv", "dataset_description.json", "submission.xlsx", "submission.json", "submission.csv", "samples.xlsx", "samples.csv", "samples.json", "subjects.xlsx", "subjects.csv", "subjects.json", "CHANGES.txt", "README.txt"].includes(baseName))) {
        alert("Only SPARC metadata files are allowed in the high-level dataset folder:\n\n- dataset_description.xslx/.csv/.json\n- submission.xslx/.csv/.json\n- subjects.xslx/.csv/.json\n- samples.xslx/.csv/.json\n- CHANGES.txt\n- README.txt")
        break
      } else {
        var duplicate = false;
        for (var objKey in currentLocation) {
          if (Array.isArray(currentLocation[objKey])) {
            if (baseName === objKey) {
              duplicate = true
              break
            }
          }
        }
        if (duplicate) {
          alert('Duplicate file name: ' + baseName)
        } else {
          currentLocation[baseName] = [fileArray[i], "", "", false, false]
          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

          $('#items').html(appendString)

          listItems(currentLocation)
          getInFolder()
        }
      }
  }
}

//////////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////////
///// CONTEXT MENU OPTIONS
//////////////////////////////////////////////////////////////////////////////


let menuFolder = null;
let menuFile = null;
menuFolder = document.querySelector('.menu-folder');
menuFile = document.querySelector('.menu-file');

function folderContextMenu(event) {

  $(".menu-folder li").unbind().click(function(){
    if ($(this).attr('id') === "folder-rename") {
        renameFolder(event)
      } else if ($(this).attr('id') === "folder-delete") {
        delFolder(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("folder")
 });
 hideMenu("folder")
}

function fileContextMenu(event) {

  $(".menu-file li").unbind().click(function(){
    if ($(this).attr('id') === "file-rename") {
        renameFolder(event)
      } else if ($(this).attr('id') === "file-delete") {
        delFolder(event)
      } else if ($(this).attr('id') === "file-description") {
        editDesc(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("file")
 });
 hideMenu("file")
}


// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {

    // Avoid the real one
    event.preventDefault();

    // Show contextmenu
    if (event.target.classList.value === "fas fa-folder") {
      showmenu(event, "folder")
      hideMenu("file")
    } else if (event.target.classList.value === "far fa-file-alt") {
      showmenu(event, "file")
      hideMenu("folder")
    }
});


// If the document is clicked somewhere
document.addEventListener('contextmenu', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    showmenu(e, "folder")
  } else if (e.target.classList.value === "far fa-file-alt") {
    showmenu(e, "file")
  } else {
    hideMenu("folder")
    hideMenu("file")
  }
});

// If the document is clicked somewhere
document.addEventListener('click', function(e){
  if (e.target.classList.value !== "fas fa-folder" && e.target.classList.value !== "far fa-file-alt") {
    hideMenu("folder")
    hideMenu("file")
    hideFullPath()
  }
});

function editDesc(ev) {

  var fileName = ev.parentElement.parentElement.innerText

  /// update jsonObjGlobal with the new name
  /// get current location first

  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered)

  bootbox.prompt({
    title: "<h6>Please choose an option: </h6>",
    buttons: {
      cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
            label: '<i class="fa fa-check"></i> Continue',
            className: 'btn-success'
        }
    },
    centerVertical: true,
    size: 'small',
    inputType: 'radio',
    inputOptions: [{
        text: '<h7>Add/edit description</h7>',
        value: 'description',
        className: 'bootbox-input-text'
    },
    {
        text: 'Add/edit additional metadata',
        value: 'metadata'
    }],
    callback: function (result) {
      if (result==="metadata") {
        bootbox.prompt({
          title: "<h6>Enter additional metadata: </h6>",
          centerVertical: true,
          size: 'small',
          buttons: {
            cancel: {
                  label: '<i class="fa fa-times"></i> Cancel'
              },
            confirm: {
              label: '<i class="fa fa-check"></i> Save',
              className: 'btn-success',
            }
          },
          inputType: 'textarea',
          callback: function (r) {
            if (r !== null) {
              myPath[fileName][2] = r
              bootbox.confirm({
                message: "Would you like to add this additional metadata to all the files in this folder?",
                buttons: {
                    confirm: {
                        label: 'Yes, apply to all',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                centerVertical: true,
                callback: function (confirm) {
                  myPath[fileName][4] = confirm
                  console.log(myPath);
                }
              })
            }
          }
      });
      } else if (result==="description"){
        bootbox.prompt({
          title: "<h6>Enter a description: </h6>",
          inputType: 'textarea',
          buttons: {
            cancel: {
                  label: '<i class="fa fa-times"></i> Cancel'
              },
            confirm: {
              label: '<i class="fa fa-check"></i> Save',
              className: 'btn-success',
            }
          },
          centerVertical: true,
          callback: function (r) {
            if (r !== null) {
              myPath[fileName][1] = r
              bootbox.confirm({
                message: "Would you like to add this description to all the files in this folder?",
                buttons: {
                    confirm: {
                        label: 'Yes, apply to all',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                centerVertical: true,
                callback: function (confirm) {
                    myPath[fileName][3] = confirm
                    console.log(myPath)
                }
              })
            }
          }
      });
      }
    }
  });

    listItems(myPath)
    getInFolder(myPath)
}


function renameFolder(event1) {

  var promptVar;
  var type;
  var newName;
  var currentName = event1.parentElement.parentElement.innerText
  var nameWithoutExtension;
  var highLevelFolderBool;

  if (["code", "derivative", "docs", "source", "primary", "protocol"].includes(currentName)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (event1.classList.value === "far fa-file") {
    promptVar = "file";
    type = "file";
  } else if (event1.classList.value === "fas fa-folder") {
    promptVar = "folder";
    type = "folder";
  }

  if (type==="file") {
    nameWithoutExtension = currentName.slice(0,currentName.indexOf("."))
  } else {
    nameWithoutExtension = currentName
  }

  if (highLevelFolderBool) {
    alert("High-level SPARC folders cannot be renamed!")
  } else {
    // show input box for new name

    bootbox.prompt({
      title: '<h6>Renaming '+ promptVar + ":" + '</h6>',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Save',
              className: 'btn-success'
          }
      },
      value: nameWithoutExtension,
      centerVertical: true,

      callback: function (r) {
          console.log(r)
          if(r!==null){
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
    }
  })
    }
}

function delFolder(event2) {

  var itemToDelete = event2.parentElement.parentElement.innerText

  if (["code", "derivative", "docs", "source", "primary", "protocol"].includes(itemToDelete)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (highLevelFolderBool) {
    alert("High-level SPARC folders cannot be deleted!")
  } else {
    bootbox.confirm({
      title: "Deleting a folder...",
      message: "Are you sure you want to delete this folder and all of its files?",
      onEscape: true,
      centerVertical: true,
      callback: function(result) {
      if(result !== null && result === true) {
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
    }
  })
}
}

function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    if (category === "folder") {
      menuFolder.style.display = "block";
      menuFolder.style.top = `${ev.clientY - 10}px`;
      menuFolder.style.left = `${ev.clientX + 15}px`;
    } else {
      menuFile.style.display = "block";
      menuFile.style.top = `${ev.clientY - 10}px`;
      menuFile.style.left = `${ev.clientX + 15}px`;
    }

}

function hideMenu(category){

  if (category === "folder") {
    menuFolder.style.display = "none";
    menuFolder.style.top = "-200%";
    menuFolder.style.left = '-200%';
  } else {
    menuFile.style.display = "block";
    menuFile.style.top = "-210%";
    menuFile.style.left = "-210%";
  }

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
        appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
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
              alert("Only SPARC metadata files are allowed in the high-level dataset folder:\n\n- dataset_description.xslx/.csv/.json\n- submission.xslx/.csv/.json\n- subjects.xslx/.csv/.json\n- samples.xslx/.csv/.json\n- CHANGES.txt\n- README.txt")
            } else {
              myPath[itemName] = [itemPath, "", "", false, false]

              var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);

              listItems(myPath)
              getInFolder()
            }
        }
      } else {
          myPath[itemName][0] = itemPath

          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
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

          var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    }
  }
}

function showFullPath(ev, text) {
  ev.preventDefault()
  fullPathValue.style.display = "block";
  fullPathValue.style.top = `${ev.clientY - 10}px`;
  fullPathValue.style.left = `${ev.clientX + 15}px`;
  fullPathValue.innerHTML = text
}

function hideFullPath() {
  fullPathValue.style.display = "none";
  fullPathValue.style.top = '-210%';
  fullPathValue.style.left = '-210%';
}

/// hover for a full path
function hoverForPath(ev) {
    var currentPath = globalPath.value
    var jsonPathArray = currentPath.split("/")
    var filtered = jsonPathArray.filter(function (el) {
      return el != "";
    });

    var myPath = getRecursivePath(filtered)

    // get full path from JSON object
    var fullPath = myPath[ev.innerText]
    showFullPath(event, fullPath[0])
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {

  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    ev.preventDefault()
    fullNameValue.style.display = "block";
    fullNameValue.style.top = `${ev.clientY - 10}px`;
    fullNameValue.style.left = `${ev.clientX + 15}px`;
    fullNameValue.innerHTML = text
  }
}

function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

///hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText

    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// If the document is clicked somewhere
document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value !== "far fa-file-alt") {
    hideFullPath()
  } else {
    hoverForPath(e)
  }
});

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});


getInFolder()

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  Object.keys(object).sort().forEach(function(key) {
  if (Array.isArray(object[key])) {
    orderedFiles[key] = object[key]
  } else {
      orderedFolders[key] = object[key];
  }
  });
  const orderedObject = {
    ...orderedFolders,
    ...orderedFiles
  }
  return orderedObject
}

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

        var sortedObj = sortObjByKeys(jsonObj)

        for (var item in sortedObj) {
          if (Array.isArray(sortedObj[item])) {
            appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i oncontextmenu="fileContextMenu(this)" class="far fa-file-alt" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
          }
          else {
            folderID = item
            appendString = appendString + '<div class="single-item"  onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()" id=' + folderID + '><h1 class="folder blue"><i oncontextmenu="folderContextMenu(this)" class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
          }
        }

        $('#items').empty()
        $('#items').html(appendString)
  }

function loadFileFolder(myPath) {
  var appendString = ""

  var sortedObj = sortObjByKeys(myPath)

  for (var item in sortedObj) {
    if (typeof sortedObj[item] === "string") {
      appendString = appendString + '<li><div class="single-item"><h1 class="folder file"><i class="far fa-file-alt" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div></li>'
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
