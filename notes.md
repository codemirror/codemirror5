# Features to Test

### Testing ContentEditable
**IN PROGRESS**
&#x1F535;

Details in
https://docs.google.com/spreadsheets/d/1VWlJQrEKwQFvZjXJrPiOWz59Sanv9eK58RRvbo1e83A/edit#gid=0

Can be set using inputStyle: "contenteditable"

**NOTE** Typing is not read out in this mode

**FIX** Add contenteditable="true" to the parent class containing the code - class='CodeMirror-lines' - app.js

    document.getElementsByClassName('CodeMirror-lines')[0].contentEditable = true;


### Including vi
**DONE**
&#x2705;

Code for this is present in index.html


    <script src="keymap/vim.js"></script>

    var myCodeMirror = CodeMirror(document.body, {
      value: "console.log('potato')",
      mode:  "javascript",
      lineNumbers: true,
      keyMap: 'vim'
    });


### Helpful coding features
**IN PROGRESS**
&#x1F535;

Including simple functionalities (**How does it work with VO??**)
* auto indenting
  * already true
  * **NOTE** VO does not announce it.
* complete the brackets
  * add *addon/edit/closebrackets.js*
  * set *autoCloseBrackets: true*
  * **ISSUE:** VO does not read the brackets out loud if this used



### Changing the font size
**TODO**
&#x1F534;

Going to try and add buttons to achieve this

### Getting the line position
**TODO**
&#x1F534;

myCodeMirror.doc.getCursor() gives the line and column(?) number


### Getting total number of lines
**DONE-ISH**
&#x1F535;

    <div id="noOfLines" aria-live="assertive" > no Of lines - 10 </div>

    myCodeMirror.setOption("extraKeys", {
      'Ctrl-L': function(cm) {
        document.getElementById('noOfLines').innerHTML = 'no of lines - ' + myCodeMirror.lineCount();
      }
    });

### Adding different themes
**DONE**
&#x2705;

To test, have added a button to toggle between 2 themes

**app.js**

    function toggleTheme() {
      if(isLightTheme == 1) {
        myCodeMirror.setOption('theme','blackboard');
        isLightTheme = 0;
      }
      else {
        myCodeMirror.setOption('theme','default');
        isLightTheme = 1;
      }
    }
