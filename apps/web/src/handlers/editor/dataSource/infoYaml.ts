const facilityInfoYaml = {
    "type": "view",
    "style": {
        "marginTop": "0.02",
        "display": "flex"
    },
    "children": [
        {
            "type": "image",
            "path": "office-building.svg",
            "path=func": ".builtIn.utils.prepareDocToPath",
            "dataKey": "formData.facilityInfo.avatar",
            "style": {
                "marginTop": "0.025",
                "width": "0.02756",
                "height": "0.053"
            }
        },
        {
            "type": "view",
            "style": {
                "marginLeft": "0.015"
            },
            "children": [
                {
                    "type": "label",
                    "style": {
                        "color": "0x333333",
                        "fontSize": ".NoodlFont.pt20",
                        "fontWeight": "600",
                        "wordBreak": "keep-all",
                        "marginTop": "0"
                    },
                    "dataKey": "formData.facilityInfo.facilityName"
                },
                {
                    "type": "label",
                    "style": {
                        "color": "0x333333",
                        "fontSize": ".NoodlFont.pt14",
                        "fontWeight": "500",
                        "wordBreak": "keep-all",
                        "marginTop": "0.01"
                    },
                    "dataKey": "formData.facilityInfo.location"
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001",
                        "display": "flex"
                    },
                    "children": [
                        {
                            "type": "view",
                            "style": {
                                "marginTop": "0.001",
                                "width": "0.13"
                            },
                            "children": [
                                {
                                    "type": "label",
                                    "text": "Main #",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "fontSize": ".Nfont.nf0",
                                        "color": "0x666666",
                                        "wordBreak": "keep-all"
                                    }
                                },
                                {
                                    "type": "label",
                                    "text": "--",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "marginLeft": "0.0046",
                                        "fontSize": ".Nfont.nf1",
                                        "fontWeight": "600",
                                        "color": "0x333333",
                                        "wordBreak": "keep-all"
                                    },
                                    "dataKey": "formData.facilityInfo.main"
                                }
                            ]
                        },
                        {
                            "type": "view",
                            "style": {
                                "marginTop": "0.001"
                            },
                            "children": [
                                {
                                    "type": "label",
                                    "text": "Email",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "fontSize": ".Nfont.nf0",
                                        "color": "0x666666",
                                        "wordBreak": "keep-all"
                                    }
                                },
                                {
                                    "type": "label",
                                    "text": "--",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "marginLeft": "0.0046",
                                        "fontSize": ".Nfont.nf1",
                                        "fontWeight": "600",
                                        "color": "0x333333",
                                        "wordBreak": "keep-all"
                                    },
                                    "dataKey": "formData.facilityInfo.email"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001",
                        "display": "flex"
                    },
                    "children": [
                        {
                            "type": "view",
                            "style": {
                                "marginTop": "0.001",
                                "width": "0.13"
                            },
                            "children": [
                                {
                                    "type": "label",
                                    "text": "Fax #",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "fontSize": ".Nfont.nf0",
                                        "color": "0x666666",
                                        "wordBreak": "keep-all"
                                    }
                                },
                                {
                                    "type": "label",
                                    "text": "--",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "marginLeft": "0.0046",
                                        "fontSize": ".Nfont.nf1",
                                        "fontWeight": "600",
                                        "color": "0x333333",
                                        "wordBreak": "keep-all"
                                    },
                                    "dataKey": "formData.facilityInfo.fax"
                                }
                            ]
                        },
                        {
                            "type": "view",
                            "style": {
                                "marginTop": "0.001"
                            },
                            "children": [
                                {
                                    "type": "label",
                                    "text": "Website",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "fontSize": ".Nfont.nf0",
                                        "color": "0x666666",
                                        "wordBreak": "keep-all"
                                    }
                                },
                                {
                                    "type": "label",
                                    "text": "--",
                                    "style": {
                                        "display": "inline-block",
                                        "verticalAlign": "middle",
                                        "marginLeft": "0.0046",
                                        "fontSize": ".Nfont.nf1",
                                        "fontWeight": "600",
                                        "color": "0x333333",
                                        "wordBreak": "keep-all"
                                    },
                                    "dataKey": "formData.facilityInfo.website"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

const providerInfoYaml = {
    "type": "view",
    "style": {
        "marginTop": "0.03"
    },
    "children": [
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "style": {
                        "color": "0x333333",
                        "fontSize": ".NoodlFont.pt20",
                        "fontWeight": "600",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.providerFullName"
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "No content",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all",
                                "lineHeight": "2vh"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.specialty"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "LIC #",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.lic"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "NPI #",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.npi"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "DEA #",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.dea"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "Email",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.providerInfo.email"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "Fax #",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.facilityInfo.fax"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "Main #",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.facilityInfo.phone"
                        }
                    ]
                },
                {
                    "type": "view",
                    "style": {
                        "marginTop": "0.001"
                    },
                    "children": [
                        {
                            "type": "label",
                            "text": "Address",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "fontSize": ".Nfont.nf0",
                                "color": "0x666666",
                                "wordBreak": "keep-all"
                            }
                        },
                        {
                            "type": "label",
                            "text": "--",
                            "style": {
                                "display": "inline-block",
                                "verticalAlign": "middle",
                                "marginLeft": "0.0046",
                                "fontSize": ".Nfont.nf1",
                                "fontWeight": "600",
                                "color": "0x333333",
                                "wordBreak": "keep-all"
                            },
                            "dataKey": "apiRequest.progressReport.docReq.name.data.facilityInfo.location"
                        }
                    ]
                }
            ]
        }
    ]
}

const patientInfoYaml = {
    "type": "view",
    "style": {
        "marginTop": "0.025"
    },
    "children": [
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Exam Date",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "text=func": ".builtIn.string.formatUnixtime_en",
                    "dataKey": "formData.patientInfo.examDate"
                }
            ]
        },
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Patient Name",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "formData.patientInfo.patientName"
                }
            ]
        },
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Date of Birth",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "formData.patientInfo.dob"
                }
            ]
        },
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Phone #",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "formData.patientInfo.phone"
                }
            ]
        },
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Email",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "formData.patientInfo.email"
                }
            ]
        },
        {
            "type": "view",
            "style": {
                "marginTop": "0.001"
            },
            "children": [
                {
                    "type": "label",
                    "text": "Patient Address",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "fontSize": ".Nfont.nf0",
                        "color": "0x666666",
                        "wordBreak": "keep-all"
                    }
                },
                {
                    "type": "label",
                    "text": "--",
                    "style": {
                        "display": "inline-block",
                        "verticalAlign": "middle",
                        "marginLeft": "0.0046",
                        "fontSize": ".Nfont.nf1",
                        "fontWeight": "600",
                        "color": "0x333333",
                        "wordBreak": "keep-all"
                    },
                    "dataKey": "formData.patientInfo.address"
                }
            ]
        }
    ]
}

export {
    facilityInfoYaml,
    providerInfoYaml,
    patientInfoYaml
}