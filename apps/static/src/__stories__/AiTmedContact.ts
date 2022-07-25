export default `AiTmedContact:
  viewPort: top
  formDataTemp:
    ListData:
      - key: 1. Self- Scheduling
      - key: 2. HD Video Call
      - key: 3. Cloud Waiting/Exam Room
      - key: 4. E-prescription
      - key: 5. Encrypted document Sharing
      - key: 6. E-Referral
      - key: 7. Customized Telehealth Platform
      - key: 8. E-Med Store
  components:
    - type: view
      style:
        marginTop: calc(115.08/1724.81*100vw)
        left: "0"
        height: calc(479.5/1724.81*100vw)
        width: calc(1514.77/1724.81*100vw)
      children:
        - type: label
          text: Contact With Us!
          style:
            top: calc(50.46/1724.81*100vw)
            left: calc(269.456/1724.81*100vw)
            fontSize: calc(26.91/1724.81*100vw)
            fontWeight: '700'
        - type: list
          contentType: listObject
          listObject: ..formDataTemp.ListData
          iteratorVar: itemObject
          style:
            left: calc(224.55/1724.81*100vw)
            width: calc(449.1/1724.81*100vw)
            height: calc(285.94/1724.81*100vw)
            top: calc(84.1/1724.81*100vw)
          children:
            - type: listItem
              itemObject: ""
              style:
                left: "0"
                marginTop: calc(16.82/1724.81*100vw)
                width: calc(449.1/1724.81*100vw)
                height: calc(16.82/1724.81*100vw)
              children:
                - type: label
                  dataKey: itemObject.key
                  style:
                    top: calc(8.41/1724.81*100vw)
                    width: calc(449/1724.81*100vw)
                    left: calc(44.9/1724.81*100vw)
                    height: calc(33.64/1724.81*100vw)
                    fontFamily: "Arial"
                    fontSize: calc(15.8/1724.81*100vw)
                    fontWeight: "300"
        - type: view
          style:
            left: calc(748.49/1724.81*100vw)
            height: calc(336.4/1724.81*100vw)
            width: calc(598.79/1724.81*100vw)
            top: calc(84.1/1724.81*100vw)
          children:
            - .ContactText: null
            - .ContactText: null
              text: Email
              style:
                left: calc(299.4/1724.81*100vw)
            - .ContactText: null
              text: Phone
              style:
                top: calc(126.15/1724.81*100vw)
            - .ContactText: null
              text: Address
              style:
                left: calc(299.4/1724.81*100vw)
                top: calc(126.15/1724.81*100vw)
            - .ContactText: null
              text: Message
              style:
                top: calc(201.84/1724.81*100vw)
            - .ContactField: null
            - .ContactField: null
              style:
                left: calc(299.4/1724.81*100vw)
            - .ContactField: null
              style:
                top: calc(159.79/1724.81*100vw)
            - .ContactField: null
              style:
                left: calc(299.4/1724.81*100vw)
                top: calc(159.79/1724.81*100vw)
            - .ContactField: null
              style:
                top: calc(227.07/1724.81*100vw)
                height: calc(67.28/1724.81*100vw)
                width: calc(523.94/1724.81*100vw)
        - type: view
          children:
            - type: button
              onClick: null # - goto: Send
              text: "Send"
              style:
                fontSize: calc(15.98/1724.81*100vw)
                color: '0xffffff'
                fontFamily: 'Arial'
                backgroundColor: "0x30b354"
                width: calc(112.27/1724.81*100vw)
                zIndex: '99'
                borderRadius: "3"
                height: calc(37.85/1724.81*100vw)
                left: calc(1179.62/1724.81*100vw)
                top: calc(395.27/1724.81*100vw)
                textAlign:
                  x: center
                  y: center

    - type: view
      style:
        marginTop: calc(42.05/1724.81*100vw)
        left: '0'
        width: calc(1514.77/1724.81*100vw)
        height: calc(504.6/1724.81*100vw)
      children:
        - type: image
          path: IconIonicArrowBackL.png
          onClick:
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "1"
                            - actionType: evalObject
                              object:
                                - ..flag@: "2"
                                - ..formDataTemp.messageAitmed@: =..productAitmedOne
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "2"
                            - actionType: evalObject
                              object:
                                - ..flag@: "3"
                                - ..formDataTemp.messageAitmed@: =..productAitmedTwo
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "3"
                            - actionType: evalObject
                              object:
                                - ..flag@: "4"
                                - ..formDataTemp.messageAitmed@: =..productAitmedThree
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "4"
                            - actionType: evalObject
                              object:
                                - ..flag@: "5"
                                - ..formDataTemp.messageAitmed@: =..productAitmedFour
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "5"
                            - actionType: evalObject
                              object:
                                - ..flag@: "6"
                                - ..formDataTemp.messageAitmed@: =..productAitmedFive
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "6"
                            - actionType: evalObject
                              object:
                                - ..flag@: "7"
                                - ..formDataTemp.messageAitmed@: =..productAitmedSix
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "7"
                            - actionType: evalObject
                              object:
                                - ..flag@: "8"
                                - ..formDataTemp.messageAitmed@: =..productAitmedSeven
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "8"
                            - actionType: evalObject
                              object:
                                - ..flag@: "1"
                                - ..formDataTemp.messageAitmed@: =..productAitmedZero
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - ..tar@: true
            - actionType: builtIn
              funcName: redraw
              viewTag: aitmedList
            - actionType: builtIn
              funcName: redraw
              viewTag: imgViewTag
          style:
            top: calc(155.59/1724.81*100vw)
            zIndex: '100'
            height: calc(33.64/1724.81*100vw)
            width: calc(29.94/1724.81*100vw)
            left: calc(149.7/1724.81*100vw)
        - type: view
          style:
            height: calc(336.4/1724.81*100vw)
            width: calc(1197.58/1724.81*100vw)
            top: '0'
            left: calc(149.7/1724.81*100vw)
          children:
            - type: list
              viewTag: aitmedList
              contentType: listObject
              listObject: ..formDataTemp.messageAitmed
              iteratorVar: itemObject
              style:
                width: calc(1122.74/1724.81*100vw)
                margin: '0'
                marginTop: '0'
                height: calc(336.4/1724.81*100vw)
                left: calc(37.43/1724.81*100vw)
                axis: horizontal
              children:
                - type: listItem
                  itemObject: ''
                  style:
                    textAlign:
                      x: center
                      y: center
                    height: calc(336.4/1724.81*100vw)
                    width: calc(224.55/1724.81*100vw)
                    left: '0'
                  children:
                    - type: image
                      path: itemObject.imagePath
                      style:
                        display: 'inline-block'
                        height: itemObject.hei
                    - type: label
                      dataKey: itemObject.imgName
                      style:
                        top: calc(294.35/1724.81*100vw)
                        width: calc(239.52/1724.81*100vw)
                        textAlign:
                          x: center
                          y: center
                        fontSize: itemObject.fontSize
                        fontWeight: itemObject.fontWeight
                        color: itemObject.color
                        fontFamily: 'Arial'
                        height: calc(67.28/1724.81*100vw)
        - type: image
          path: IconIonicArrowBack.png
          onClick:
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "1"
                            - actionType: evalObject
                              object:
                                - ..flag@: "8"
                                - ..formDataTemp.messageAitmed@: =..productAitmedSeven
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "8"
                            - actionType: evalObject
                              object:
                                - ..flag@: "7"
                                - ..formDataTemp.messageAitmed@: =..productAitmedSix
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "7"
                            - actionType: evalObject
                              object:
                                - ..flag@: "6"
                                - ..formDataTemp.messageAitmed@: =..productAitmedFive
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "6"
                            - actionType: evalObject
                              object:
                                - ..flag@: "5"
                                - ..formDataTemp.messageAitmed@: =..productAitmedFour
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "5"
                            - actionType: evalObject
                              object:
                                - ..flag@: "4"
                                - ..formDataTemp.messageAitmed@: =..productAitmedThree
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "4"
                            - actionType: evalObject
                              object:
                                - ..flag@: "3"
                                - ..formDataTemp.messageAitmed@: =..productAitmedTwo
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "3"
                            - actionType: evalObject
                              object:
                                - ..flag@: "2"
                                - ..formDataTemp.messageAitmed@: =..productAitmedOne
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - if:
                    - ..tar
                    - actionType: evalObject
                      object:
                        - if:
                            - =.builtIn.string.equal:
                                dataIn:
                                  string1: =..flag
                                  string2: "2"
                            - actionType: evalObject
                              object:
                                - ..flag@: "1"
                                - ..formDataTemp.messageAitmed@: =..productAitmedZero
                                - ..tar@: false
                            - continue
                    - continue
            - actionType: evalObject
              object:
                - ..tar@: true
            - actionType: builtIn
              funcName: redraw
              viewTag: aitmedList
          style:
            top: calc(155.58/1724.81*100vw)
            height: calc(33.64/1724.81*100vw)
            width: calc(29.94/1724.81*100vw)
            left: calc(1317.34/1724.81*100vw)
`
