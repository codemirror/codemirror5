;;; sws-mode.el --- (S)ignificant (W)hite(S)pace mode
;;;
;;; URL: https://github.com/brianc/jade-mode
;;; Author: Brian M. Carlson and other contributors
;;;
(require 'font-lock)

(defvar sws-tab-width 2)

(defmacro sws-line-as-string ()
  "Returns the current line as a string."
  `(buffer-substring (point-at-bol) (point-at-eol)))

(defun sws-previous-indentation ()
  "Gets indentation of previous line"
  (save-excursion
    (forward-line -1)
    (if (bobp) 0
      (progn
        (while (and (looking-at "^[ \t]*$") (not (bobp))) (forward-line -1))
        (current-indentation)))))

(defun sws-max-indent ()
  "Calculates max indentation"
  (+ (sws-previous-indentation) sws-tab-width))

(defun sws-empty-line-p ()
  "If line is completely empty"
  (= (point-at-bol) (point-at-eol)))

(defun sws-point-to-bot ()
  "Moves point to beginning of text"
  (beginning-of-line-text))

(defun sws-do-indent-line ()
  "Performs line indentation"
  ;;if we are not tabbed out past max indent
  (if (sws-empty-line-p)
      (indent-to (sws-max-indent))
    (if (< (current-indentation) (sws-max-indent))
        (indent-to (+ (current-indentation) sws-tab-width))
      ;; if at max indent move text to beginning of line
      (progn
        (beginning-of-line)
        (delete-horizontal-space)))))

(defun sws-indent-line ()
  "Indents current line"
  (interactive)
  (if (eq this-command 'indent-for-tab-command)
    (if mark-active
        (sws-indent-region (region-beginning) (region-end))
      (if (sws-at-bot-p)
          (sws-do-indent-line)
        (sws-point-to-bot)))
    (indent-to (sws-previous-indentation))))

(defun sws-at-bol-p ()
  "If point is at beginning of line"
  (interactive)
  (= (point) (point-at-bol)))

(defun sws-at-bot-p ()
  "If point is at beginning of text"
  (= (point) (+ (current-indentation) (point-at-bol))))

(defun sws-print-line-number ()
  "Prints line number"
  (sws-print-num (point)))

(defun sws-print-num (arg)
  "Prints line number"
  (message (number-to-string arg)))

(defun sws-indent-to (num)
  "Force indentation to level including those below current level"
  (save-excursion
    (beginning-of-line)
    (delete-horizontal-space)
    (indent-to num)))

(defun sws-move-region (begin end prog)
  "Moves left is dir is null, otherwise right. prog is '+ or '-"
  (save-excursion
    (let (first-indent indent-diff)
      (goto-char begin)
      (setq first-indent (current-indentation))
      (sws-indent-to
       (funcall prog first-indent sws-tab-width))
      (setq indent-diff (- (current-indentation) first-indent))
      ;; move other lines based on movement of first line
      (while (< (point) end)
        (forward-line 1)
        (if (< (point) end)
            (sws-indent-to (+ (current-indentation) indent-diff)))))))

(defun sws-indent-region (begin end)
  "Indents the selected region"
  (interactive)
  (sws-move-region begin end '+))


(defun sws-dendent-line ()
  "De-indents current line"
  (interactive)
  (if mark-active
      (sws-move-region (region-beginning) (region-end) '-)
    (if (sws-at-bol-p)
        (progn
          (message "at mother fucking bol")
          (delete-horizontal-space)
          (indent-to (sws-max-indent)))
      (let ((ci (current-indentation)))
        (beginning-of-line)
        (delete-horizontal-space)
        (indent-to (- ci sws-tab-width))))))

(defvar sws-mode-map (make-sparse-keymap))
(define-key sws-mode-map [S-tab] 'sws-dendent-line)
(define-key sws-mode-map [backtab] 'sws-dendent-line)

;;;###autoload
(define-derived-mode sws-mode fundamental-mode
  "sws"
  "Major mode for editing significant whitespace files"
  (kill-all-local-variables)

  ;; default tab width
  (setq sws-tab-width 2)
  (make-local-variable 'indent-line-function)
  (setq indent-line-function 'sws-indent-line)
  (make-local-variable 'indent-region-function)

  (setq indent-region-function 'sws-indent-region)

  ;; TODO needed?
  (setq indent-tabs-mode nil)

  ;; keymap
  (use-local-map sws-mode-map)
  (setq major-mode 'sws-mode))

(provide 'sws-mode)
;;; sws-mode.el ends here
