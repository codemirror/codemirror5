import TextareaInput from "./TextareaInput"
import { hiddenPassword } from "./input"

export default class PasswordInput extends TextareaInput {
  _getHiddenInput() {
    return hiddenPassword()
  }
}