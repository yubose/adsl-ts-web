import * as u from '@jsmanifest/utils'
import React from 'react'
import { Helmet } from 'react-helmet'
import { css } from '@emotion/css'
import { useStaticQuery, graphql } from 'gatsby'
import { NUI } from 'noodl-ui'
import useNormalizeProps from '@/hooks/useNormalizeProps'
import aitmednowordsSVG from '@/assets/aitmednowords.svg'

export interface NavbarProps {
  //
}

function Navbar(props) {
  const { normalizeProps } = useNormalizeProps({
    getBaseStyles: NUI.getBaseStyles,
  })
  const listData = [
    {
      title: 'Find My Care',
      pageName: 'AiTmedCare',
      val: '0xe8e8e8',
      fontColor: '0x000000',
      fontSize: '2.28vh',
      left: '0vw',
      marginLeft: '0',
      width: 'calc(7vw)',
      textDecoration: 'none',
    },
    {
      title: 'For Provider',
      fontColor: '0x000000',
      fontSize: '2.28vh',
      left: '2vw',
      marginLeft: '0',
      width: 'calc(7vw)',
      textDecoration: 'none',
    },
    {
      title: 'For Business',
      fontColor: '0x000000',
      fontSize: '2.28vh',
      left: '3vw',
      width: 'calc(7vw)',
      marginLeft: '0.8vw',
      textDecoration: 'none',
    },
    {
      title: 'Aitmed Care',
      fontColor: '0x333333',
      fontSize: '2.28vh',
      left: '5vw',
      marginLeft: '0',
      width: 'calc(7vw)',
      textDecoration: 'none',
    },
    {
      title: 'Sign in / Sign up',
      fontColor: '0x333333',
      fontSize: '2.28vh',
      left: '11.7vw',
      marginLeft: '0',
      width: 'calc(9vw)',
      textDecoration: 'underline',
    },
  ]

  return null
  // return (
  //   <Box
  //     as="nav"
  //     className={css`
  //       width: calc(1514.77 / 1724.81 * 100vw);
  //       margin-top: 0px;
  //       height: calc(116.17 / 1724.81 * 100vw);
  //       left: 0px;
  //       right: 0px;
  //       position: fixed;
  //       z-index: 10000;
  //       margin: auto;
  //       background-color: #ffffff;
  //       box-shadow: 0px 2px 2px #dddddd;
  //     `}
  //   >
  //     <Box
  //       className={css`
  //         margin: auto;
  //         width: calc(1050.77 / 1724.81 * 100vw);
  //       `}
  //     >
  //       <Box
  //         className={css`
  //           width: calc(200.28 / 1724.81 * 100vw);
  //           height: calc(116.28 / 1724.81 * 100vw);
  //         `}
  //       >
  //         <Image
  //           className={css`
  //             top: calc(24.23 / 1724.81 * 100vw);
  //             width: calc(57.09 / 1724.81 * 100vw);
  //           `}
  //           src={aitmednowordsSVG}
  //           alt=""
  //         />
  //         <Heading
  //           className={css`
  //             left: calc(65.96 / 1724.81 * 100vw);
  //             width: calc(129.36 / 1724.81 * 100vw);
  //             font-size: calc(20 / 1724.81 * 100vw);
  //             font-style: bold;
  //             font-family: Arial;
  //             height: calc(116.28 / 1724.81 * 100vw);
  //             margin-right: 0px;
  //             display: flex;
  //             align-items: center;
  //           `}
  //         >
  //           AiTmed
  //         </Heading>
  //       </Box>
  //       <Box
  //         className={css`
  //           left: calc(11.6vw);
  //           width: calc(862.41 / 1724.81 * 100vw);
  //           top: 0px;
  //           height: calc(116.28 / 1724.81 * 100vw);
  //         `}
  //       >
  //         <ButtonGroup
  //           className={css`
  //             width: calc(52vw);
  //             margin: 0px;
  //             top: 0px;
  //             left: calc(1vw);
  //             height: calc(116.28 / 1724.81 * 100vw);
  //             display: flex;
  //             flex-wrap: nowrap;
  //           `}
  //           variant="outline"
  //           spacing="6"
  //         >
  //           {listData.map((dataObject) => {
  //             let component = (
  //               <Button
  //                 key={dataObject.title}
  //                 className={css`
  //                   width: ${dataObject.width};
  //                   height: calc(116.28 / 1724.81 * 100vw);
  //                   left: ${dataObject.left};
  //                   margin-left: ${dataObject.marginLeft};
  //                   display: flex;
  //                   align-items: center;
  //                 `}
  //               >
  //                 {dataObject.title}
  //               </Button>
  //             )

  //             return component
  //           })}
  //         </ButtonGroup>
  //       </Box>
  //       {/* <ButtonGroup>
  //         <Button>Sign in / Sign up</Button>
  //       </ButtonGroup> */}
  //     </Box>
  //   </Box>
  // )
}

export default Navbar
