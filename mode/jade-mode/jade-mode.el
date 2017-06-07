;;; jade-mode.el --- Major mode for editing .jade files
;;;
;;; URL: https://github.com/brianc/jade-mode
;;; Author: Brian M. Carlson and other contributors
;;; Package-Requires: ((sws-mode "0"))
;;;
;;; copied from http://xahlee.org/emacs/elisp_syntax_coloring.html
(require 'font-lock)
(require 'sws-mode)

(defun jade-debug (string &rest args)
  "Prints a debug message"
  (apply 'message (append (list string) args)))

(defmacro jade-line-as-string ()
  "Returns the current line as a string."
  `(buffer-substring (point-at-bol) (point-at-eol)))


(defun jade-empty-line-p ()
  "If line is empty or not."
  (= (point-at-eol) (point-at-bol)))

(defun jade-blank-line-p ()
  "If line contains only spaces."
  (string-match-p "^[ ]*$" (jade-line-as-string)))

;; command to comment/uncomment text
(defun jade-comment-dwim (arg)
  "Comment or uncomment current line or region in a smart way.
For detail, see `comment-dwim'."
  (interactive "*P")
  (require 'newcomment)
  (let (
        (comment-start "//") (comment-end "")
        )
    (comment-dwim arg)))

(defconst jade-keywords
  (eval-when-compile
    (regexp-opt
     '("if" "else" "for" "in" "each" "case" "when" "default" "block" "extends"
       "include" "yield" "mixin") 'words))
  "Jade keywords.")

(defvar jade-font-lock-keywords
  `((,"!!!\\|doctype\\( ?[A-Za-z0-9\-\_]*\\)?" 0 font-lock-comment-face) ;; doctype
    (,jade-keywords . font-lock-keyword-face) ;; keywords
    (,"#\\(\\w\\|_\\|-\\)*" . font-lock-variable-name-face) ;; id
    (,"\\(?:^[ {2,}]*\\(?:[a-z0-9_:\\-]*\\)\\)?\\(#[A-Za-z0-9\-\_]*[^ ]\\)" 1 font-lock-variable-name-face) ;; id
    (,"\\(?:^[ {2,}]*\\(?:[a-z0-9_:\\-]*\\)\\)?\\(\\.[A-Za-z0-9\-\_]*\\)" 1 font-lock-type-face) ;; class name
    (,"^[ {2,}]*[a-z0-9_:\\-]*" 0 font-lock-function-name-face))) ;; tag name

;; syntax table
(defvar jade-syntax-table
  (let ((syn-table (make-syntax-table)))
    (modify-syntax-entry ?\/ ". 12b" syn-table)
    (modify-syntax-entry ?\n "> b" syn-table)
    (modify-syntax-entry ?' "\"" syn-table)
    syn-table)
  "Syntax table for `jade-mode'.")

(defun jade-region-for-sexp ()
  "Selects the current sexp as the region"
  (interactive)
  (beginning-of-line)
  (let ((ci (current-indentation)))
    (push-mark nil nil t)
    (while (> (jade-next-line-indent) ci)
      (next-line)
      (end-of-line))))

(defvar jade-mode-map (make-sparse-keymap))
;;defer to sws-mode
;;(define-key jade-mode-map [S-tab] 'jade-unindent-line)

;; mode declaration
;;;###autoload
(define-derived-mode jade-mode sws-mode
  "Jade"
  "Major mode for editing jade node.js templates"
  :syntax-table jade-syntax-table

  (setq tab-width 2)

  (setq mode-name "Jade")
  (setq major-mode 'jade-mode)

  ;; comment syntax
  (set (make-local-variable 'comment-start) "// ")

  ;; default tab width
  (setq sws-tab-width 2)
  (make-local-variable 'indent-line-function)
  (setq indent-line-function 'sws-indent-line)
  (make-local-variable 'indent-region-function)

  (setq indent-region-function 'sws-indent-region)

  (setq indent-tabs-mode nil)

  ;; keymap
  (use-local-map jade-mode-map)

  ;; modify the keymap
  (define-key jade-mode-map [remap comment-dwim] 'jade-comment-dwim)

  ;; highlight syntax
  (setq font-lock-defaults '(jade-font-lock-keywords)))


;;;###autoload
(add-to-list 'auto-mode-alist '("\\.jade$" . jade-mode))

(provide 'jade-mode)
;;; jade-mode.el ends here
