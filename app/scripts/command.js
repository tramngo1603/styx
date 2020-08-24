const os = require('os');
const path = require('path');
const fs = require('fs');
const $ = require('jquery');
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

var highLevelFoldersList = ["code", "derivative", "primary", "source", "docs", "protocol"]

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("new-folder")
const addFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
const fullPathValue = document.querySelector(".hoverPath")
const fullNameValue = document.querySelector(".hoverFullName")
const tooltipHighLevelFolders = document.querySelector(".hoverTooltipFolders")

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

        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideNameHover()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

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
          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hidePathHover()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

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
    hidePathHover(fullPathValue)
  }
});


function renameFolder(event1) {

  var promptVar;
  var type;
  var newName;
  var currentName = event1.parentElement.parentElement.innerText
  var withoutExtension;
  var highLevelFolderBool;

  if (["code", "derivative", "docs", "source", "primary", "protocol"].includes(currentName)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

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

  if (highLevelFolderBool) {
    alert("High-level SPARC folders cannot be renamed!")
  } else {
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
        appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideNameHover()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
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
            if (!["dataset_description.xlsx", "dataset_description.csv", "dataset_description.json", "submission.xlsx", "submission.json", "submission.csv", "samples.xlsx", "samples.csv", "samples.json", "subjects.xlsx", "subjects.csv", "subjects.json", "CHANGES.txt", "README.txt"].includes(itemName)) {
              alert("Only SPARC metadata files are allowed in the high-level dataset folder:\n\n- dataset_description (.xslx/.csv/.json)\n- submission (.xslx/.csv/.json)\n- subjects (.xslx/.csv/.json)\n- samples (.xslx/.csv/.json)\n- CHANGES.txt\n- README.txt")
              break
            } else {
              myPath[itemName] = itemPath

              var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hidePathHover()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);

              listItems(myPath)
              getInFolder()
            }
        }
      } else {
          myPath[itemName] = itemPath

          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hidePathHover()"><h1 class="folder file"><i class="fas fa-file"  oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
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

          if (highLevelFoldersList.includes(itemName)) {
            var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideTooltipHover()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          } else {
            var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideNameHover()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          }
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
    showFullPath(event, fullPath)
}

//// hover over high-level folders for tooltip
function showhighLevelFolderTooltip(ev){

  var folder = ev.innerText

  if (folder === "code") {
    tooltipHighLevelFolders.innerHTML = "code: Folder containing all the source code used in the study (e.g., Python, MATLAB, etc.)"
  } else if (folder === "docs") {
    tooltipHighLevelFolders.innerHTML = "docs: Folder containing all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)"
  } else if (folder === "derivative") {
    tooltipHighLevelFolders.innerHTML = "derivative: Folder containing data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)"
  } else if (folder === "primary") {
    tooltipHighLevelFolders.innerHTML = "primary: Folder containing all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders."
  } else if (folder === "protocol") {
    tooltipHighLevelFolders.innerHTML = "protocol: Folder containing supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <a href='https://www.protocols.io/groups/sparc'>Protocols.io/sparc</a>."
  } else if (folder === "source") {
    tooltipHighLevelFolders.innerHTML = "source: Folder containing very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset."
  }

  console.log(tooltipHighLevelFolders.innerHTML)

  tooltipHighLevelFolders.style.display = "block";
  tooltipHighLevelFolders.style.top = `${ev.clientY - 10}px`;
  tooltipHighLevelFolders.style.left = `${ev.clientX + 15}px`;
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

function hidePathHover() {
  fullPathValue.style.display = "none";
  fullPathValue.style.top = '-210%';
  fullPathValue.style.left = '-210%';
}

function hideNameHover() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-230%';
  fullNameValue.style.left = '-230%';
}

function hideTooltipHover() {
  tooltipHighLevelFolders.style.display = "none";
  tooltipHighLevelFolders.style.top = '-220%';
  tooltipHighLevelFolders.style.left = '-220%';
}

///hover over a function for full name
function hoverForFullName(ev) {
    var fullName = ev.innerText
    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(ev, ev.children[1], fullName)
}

// // If the document is clicked somewhere
document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-file") {
    hoverForPath(e)
  }
  // } else if (e.target.classList.value === "fas fa-file") {
  //   hidePathHover(fullPathValue)
  // }
})

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
    showhighLevelFolderTooltip(e)
  }
  // } else {
  //   hideNameHover()
  //   hideTooltipHover()
  // }
});


getInFolder()

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  Object.keys(object).sort().forEach(function(key) {
    if (typeof object[key] === "object") {
      orderedFolders[key] = object[key];
    } else if (typeof object[key] === "string") {
      orderedFiles[key] = object[key]
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
          if (typeof sortedObj[item] !== "object") {
            appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hidePathHover()"><h1 class="folder file"><i oncontextmenu="myFunction(this)" class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
          }
          else {
            folderID = item
            if (highLevelFoldersList.includes(item)) {
              var appendString = appendString + '<div class="single-item" onmouseover="showhighLevelFolderTooltip(this)" onmouseleave="hideTooltipHover()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            } else {
              var appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideNameHover()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="myFunction(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
            }
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
