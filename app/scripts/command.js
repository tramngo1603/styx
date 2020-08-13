var cmd = require('node-cmd');
let os = require('os')
var pathlib = require('path')
var fs = require('fs');
var $ = require('jquery')

var backFolder = []
var forwardFolder =[]

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
const contextMenu = document.getElementById("mycontext")


let menu = null;
document.addEventListener('DOMContentLoaded', function(){
    //make sure the right click menu is hidden
    menu = document.querySelector('.menu');
    // menu.classList.add('off');

    //add the right click listener to the box
    let items = document.querySelectorAll('.single-item');

    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('contextmenu', showmenu, false);
    }

    //add a listener for leaving the menu and hiding it
    menu.addEventListener('mouseleave', hidemenu);

    //add the listeners for the menu items
    addMenuListeners();
});

function addMenuListeners(){
    document.getElementById('rename').addEventListener('click', function() {
      var itemID = $(this).id
      setColour(event);
    })
    document.getElementById('delete').addEventListener('click', setColour);
}

function setColour(ev){
    hidemenu();
    let clr = ev.target.id;
    if (clr === "rename") {
      console.log($(this).attr('id'))
      document.getElementById('input-global-path').style.backgroundColor = "green";
    } else {
      document.getElementById('input-global-path').style.backgroundColor = "red";
    }
}

function showmenu(ev){
    //stop the real right click menu
    ev.preventDefault();
    //show the custom menu
    menu.style.top = `${ev.clientY - 10}px`;
    menu.style.left = `${ev.clientX + 15}px`;
    menu.classList.remove('off');
}

function hidemenu(ev){
    menu.classList.add('off');
    menu.style.top = '129px';
    menu.style.left = '93px';
}

function loadFileFolder(myPath) {
  var appendString = ""
  for (var item in myPath) {
    if (!myPath[item]) {
      appendString = appendString + '<div class="single-item"><h1 class="folder file"><i class="fas fa-file" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+item+'</div></div>'
    }
    else {
      appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+item+'</div></div>'
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
  event.preventDefault();
  // console.log("Current path: " + globalPath.value)
})

// Add folder button
addNewFolder.addEventListener("click", function(event) {
  event.preventDefault();

  var newFolderName = "New Folder"
  // show input box for name
  const prompt = require('electron-prompt');

  prompt({
      title: 'Adding a new folder...',
      label: 'Enter a name for the new folder:',
      value: 'New folder',
      inputAttrs: {
          type: 'text'
      },
      type: 'input'
  })
  .then((r) => {
      if(r !== null) {
        newFolderName = r
      }
      var appendString = '';
      // var folderID = '';
      appendString = appendString + '<div class="single-item"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div contentEditable="true" id="new-folder" class="folder_desc">'+ newFolderName +'</div></div>'
      $(appendString).appendTo('#items');

      /// update jsonObjGlobal
      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      var myPath = getRecursivePath(filtered)
      console.log(myPath)

      // update Json object with new folder created
      var renamedNewFolder = newFolderName
      myPath[renamedNewFolder] = {}

      listItems(myPath)
      getInFolder()
    })

  .catch(console.error);
})

//  rename
function renameFolder(renamedNewFolder) {
  // renamedNewFolder = ""

  var myPath = jsonObjGlobal;
  for (var item of filtered) {
    myPath = myPath[item]
  }

  myPath[renamedNewFolder] = {}
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

        var myPath = getRecursivePath(filtered)

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

  }

  /// Rename a file
function renameFile() {
  $('div.folder_desc').dblclick(function(){
        if($(this).children("h1").hasClass("blue")) {
              $('.folder_desc').attr('contenteditable','true');
          }
      })
}
