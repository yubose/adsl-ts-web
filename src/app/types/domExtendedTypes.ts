export type FileInputEvent = Event & {
  target: Event['target'] & { files: FileList }
}
