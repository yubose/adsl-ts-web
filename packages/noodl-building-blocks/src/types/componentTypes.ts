import {
  ButtonComponentObject,
  DividerComponentObject,
  FooterComponentObject,
  HeaderComponentObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  ListItemComponentObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PopUpComponentObject,
  SelectComponentObject,
  ScrollViewComponentObject,
  TextFieldComponentObject,
  TextViewComponentObject,
  VideoComponentObject,
  ViewComponentObject,
} from 'noodl-types'

export type IComponent =
  | IButton
  | IDivider
  | IFooter
  | IHeader
  | IImage
  | ILabel
  | IList
  | IListItem
  | IPlugin
  | IPluginHead
  | IPopUp
  | ISelect
  | IScrollView
  | ITextField
  | ITextView
  | IVideo
  | IView

export interface IButton extends ButtonComponentObject {}

export interface IDivider extends DividerComponentObject {}

export interface IFooter extends FooterComponentObject {}

export interface IHeader extends HeaderComponentObject {}

export interface IImage extends ImageComponentObject {}

export interface ILabel extends LabelComponentObject {}

export interface IList extends ListComponentObject {}

export interface IListItem extends ListItemComponentObject {}

export interface IPlugin extends PluginComponentObject {}

export interface IPluginHead extends PluginHeadComponentObject {}

export interface IPopUp extends PopUpComponentObject {}

export interface ISelect extends SelectComponentObject {}

export interface IScrollView extends ScrollViewComponentObject {}

export interface ITextField extends TextFieldComponentObject {}

export interface ITextView extends TextViewComponentObject {}

export interface IVideo extends VideoComponentObject {}

export interface IView extends ViewComponentObject {}
