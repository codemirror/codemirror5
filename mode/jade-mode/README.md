# sws-mode

## major mode for jade-mode and stylus-mode

__S__ignificant __W__hitespace __M__ode.  Because Jade and Stylus are both 'significant white space' languages, sws-mode can be used to edit both types of files

Lines can be indented or un-indented (is that a word?) with tab, shift-tab respectively.  Indentation will look at the proceeding line and not indent more than 1 level of nesting below it.

    html
      body
        #container
        .content
      ^
      |----cursor anywhere on this line except at beginning of text, press tab or S-tab

    html
      body
        #container
        .content
        ^
        |---- cursor moves to beginning of text...once cursor is at beginning of text, press tab

    html
      body
        #container
          .content
          ^
          |---- now line is maximum indented, press tab again

    html
      body
        #container
    .content
    ^
    |---- line moves to minimum indentation level (no indentation)

Regions can be indentend in a similar way; however, this is still buggy...

Since jade and stylus nesting is somewhat related to sexp layout I hope to have sexp related selection & manipulation working in the future.  See `jade-highlight-sexp` for an example

## key bindings

  - [tab] if region is active, do 'smart indent' on region.  otherwise, move cursor to beginning of line text.  If cursor already at beginning of line text, do 'smart indent' on line.
  - [shift-tab] if region is active, do 'smart dedent' on region.  otherwise, move cursor to beginning of line text.  If cursor already at beginning of line text, do 'smart dedent' on line.


### jade-mode

Emacs major mode for [jade template](http://github.com/visionmedia/jade) highlighting.  This mode extends sws-mode to provide some rudimentary syntax highlighting.

Still in very early stages.  Some simple highlighting of tags, ids, and classes works; however, it highlights incorrectly into the javascript code and plain text code as well.


I would like to get the highlighting working better.  Also note javascript highlighting with either js2-mode or espresso-mode should be possible...I'm a major major-mode writing noob so it'll take a while.

### stylus-mode
I'm not sure yet how to highlight .styl files, so for now, just use sws-mode when editing stylus mode.

## Installation instructions

Copy the jade-mode.el and sws-mode.el to some directory on your computer.  I put mine under `~/code/jade-mode` and sym-link the jade-mode folder into `~/.emacs.d/vendor/`.  You can just as easily put the folder itself under '~/.emacs.d/vendor/`

Add the following lines to any of your initialization files

    (add-to-list 'load-path "~/.emacs.d/vendor/jade-mode")
    (require 'sws-mode)
    (require 'jade-mode)    
    (add-to-list 'auto-mode-alist '("\\.styl$" . sws-mode))
    (add-to-list 'auto-mode-alist '("\\.jade$" . jade-mode))

### Flymake support

if you want to add flymake support for jade files:

    (defun flymake-jade-init ()
      (let* ((temp-file (flymake-init-create-temp-buffer-copy
                     'flymake-create-temp-intemp))
         (local-file (file-relative-name
                      temp-file
                      (file-name-directory buffer-file-name)))
         (arglist (list local-file)))
        (list "jade" arglist)))
    (setq flymake-err-line-patterns
           (cons '("\\(.*\\): \\(.+\\):\\([[:digit:]]+\\)$"
                  2 3 nil 1)
                flymake-err-line-patterns))
    (add-to-list 'flymake-allowed-file-name-masks
             '("\\.jade\\'" flymake-jade-init))
