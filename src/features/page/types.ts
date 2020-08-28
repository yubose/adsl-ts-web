export interface PageModalState {
  id: string
  opened: boolean
  context: null | { [key: string]: any }
  props: { [key: string]: any }
}
