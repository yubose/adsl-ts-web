- [Basepage](#basepage)
  - [BaseHeader](#baseheader)
  - [WithCancelHeader](#withcancelheader)
  - [WithBackHeader](#withbackheader)
  - [HeaderRightButton](#headerrightbutton)
  - [HeaderRightImg](#headerrightimg)
  - [SearchField](#searchfield)
  - [SearchButton](#searchbutton)
- [BootNoodlForMobile_en](#bootnoodlformobile_en)
# Basepage
## BaseHeader

the base header just contains ```<title>```

## WithBackHeader
the base header with ```<back>``` & ```<title>``` 

## HeaderRightButton
header 最右侧链接

- for example:

```
  - .WithBackHeader:
  - .HeaderRightButton
    text: Contacts
```
 the code will get a header with  ```<back> <title> <Contacts>```

## HeaderRightImg

header 最右侧图片

- for example:
```
  - .WithBackHeader:
  - .HeaderRightImg
    path: sideNav2.png
```
you can get a header contains  ```<back> <title> <sidnav>button```

## SearchField

搜索框的输入框

## SearchButton

搜索框的按钮


# BootNoodlForMobile_en

