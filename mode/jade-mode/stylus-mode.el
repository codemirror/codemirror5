;;; stylus-mode.el --- Major mode for editing .jade files
;;;
;;; URL: https://github.com/brianc/jade-mode
;;; Author: Brian M. Carlson and other contributors
;;; Package-Requires: ((sws-mode "0"))
;;;
;;; copied from http://xahlee.org/emacs/elisp_syntax_coloring.html
(require 'font-lock)
(require 'sws-mode)

(defun stylus-debug (string &rest args)
  "Prints a debug message"
  (apply 'message (append (list string) args)))

(defmacro stylus-line-as-string ()
  "Returns the current line as a string."
  `(buffer-substring (point-at-bol) (point-at-eol)))


(defun stylus-empty-line-p ()
  "If line is empty or not."
  (= (point-at-eol) (point-at-bol)))

(defun stylus-blank-line-p ()
  "If line contains only spaces."
  (string-match-p "^[ ]*$" (stylus-line-as-string)))

(defconst stylus-colours
  (eval-when-compile
    (regexp-opt
     '("black" "silver" "gray" "white" "maroon" "red"
       "purple" "fuchsia" "green" "lime" "olive" "yellow" "navy"
       "blue" "teal" "aqua")))
  "Stylus keywords.")

(defconst stylus-keywords
  (eval-when-compile
    (regexp-opt
     '("return" "if" "else" "unless" "for" "in" "true" "false")))
  "Stylus keywords.")

(defvar stylus-font-lock-keywords
  `(
    (,"^[ {2,}]+[a-z0-9_:\\-]+[ ]" 0 font-lock-variable-name-face)
    (,"\\(::?\\(root\\|nth-child\\|nth-last-child\\|nth-of-type\\|nth-last-of-type\\|first-child\\|last-child\\|first-of-type\\|last-of-type\\|only-child\\|only-of-type\\|empty\\|link\\|visited\\|active\\|hover\\|focus\\|target\\|lang\\|enabled\\|disabled\\|checked\\|not\\)\\)*" . font-lock-type-face) ;; pseudoSelectors
    (,(concat "[^_$]?\\<\\(" stylus-colours "\\)\\>[^_]?")
     0 font-lock-constant-face)
    (,(concat "[^_$]?\\<\\(" stylus-keywords "\\)\\>[^_]?")
     0 font-lock-keyword-face)
    (,"\\([.0-9]+:?\\(em\\|ex\\|px\\|mm\\|cm\\|in\\|pt\\|pc\\|deg\\|rad\\|grad\\|ms\\|s\\|Hz\\|kHz\\|rem\\|%\\)\\)" 0 font-lock-constant-face)
    (,"#\\w+" 0 font-lock-keyword-face)
    (,"$\\w+" 0 font-lock-variable-name-face)
    ))

(defvar stylus-syntax-table
  (let ((syntable (make-syntax-table)))
    (modify-syntax-entry ?\/ ". 124b" syntable)
    (modify-syntax-entry ?* ". 23" syntable)
    (modify-syntax-entry ?\n "> b" syntable)
    (modify-syntax-entry ?' "\"" syntable)
    syntable)
  "Syntax table for `stylus-mode'.")

(defun stylus-region-for-sexp ()
  "Selects the current sexp as the region"
  (interactive)
  (beginning-of-line)
  (let ((ci (current-indentation)))
    (push-mark nil nil t)
    (while (> (stylus-next-line-indent) ci)
      (next-line)
      (end-of-line))))

(defvar stylus-mode-map (make-sparse-keymap))
;;defer to sws-mode
;;(define-key stylus-mode-map [S-tab] 'stylus-unindent-line)

;; mode declaration
;;;###autoload
(define-derived-mode stylus-mode sws-mode
  "Stylus"
  "Major mode for editing stylus node.js templates"
  (setq tab-width 2)

  (setq mode-name "Stylus")
  (setq major-mode 'stylus-mode)

  ;; syntax table
  (set-syntax-table stylus-syntax-table)

  ;; highlight syntax
  (setq font-lock-defaults '(stylus-font-lock-keywords))

  ;; comments
  (set (make-local-variable 'comment-start) "//")
  (set (make-local-variable 'comment-end) "")

  ;; default tab width
  (setq sws-tab-width 2)
  (make-local-variable 'indent-line-function)
  (setq indent-line-function 'sws-indent-line)
  (make-local-variable 'indent-region-function)

  (setq indent-region-function 'sws-indent-region)

  ;; keymap
  (use-local-map stylus-mode-map))

;;;###autoload
(add-to-list 'auto-mode-alist '("\\.styl$" . stylus-mode))

(provide 'stylus-mode)
;;; stylus-mode.el ends here
