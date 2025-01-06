import QuickChart from 'quickchart-js'

export function getChart(numberOfDays: number, data: number[], wordsStart: number, wordsEnd: number) {
    const chart = new QuickChart();

    const expectedData = []
    const labels = []

    const dayStep = Math.ceil((wordsEnd - wordsStart) / numberOfDays)
    const chartStep = Math.ceil((wordsEnd - wordsStart) / 2)


    for (let i = 0; i < numberOfDays; i++) {
        const value = wordsStart + dayStep * (i + 1)
        expectedData[i] = value > wordsEnd ? wordsEnd : value
        labels[i] = i + 1
    }


    chart
        .setConfig({
                "type": "bar",
                "data": {
                    "datasets": [
                        {
                            "fill": false,
                            "spanGaps": false,
                            "lineTension": 0.4,
                            "pointRadius": 3,
                            "pointHoverRadius": 3,
                            "pointStyle": "circle",
                            "borderDash": [
                                0,
                                0
                            ],
                            "barPercentage": 0.9,
                            "categoryPercentage": 0.8,
                            "data": expectedData,
                            "type": "line",
                            "label": "Dataset 2",
                            "borderColor": "#63b0dc",
                            "borderWidth": 3,
                            "hidden": false
                        },
                        {
                            "fill": true,
                            "spanGaps": false,
                            "lineTension": 0,
                            "pointRadius": 3,
                            "pointHoverRadius": 3,
                            "pointStyle": "circle",
                            "borderDash": [
                                0,
                                0
                            ],
                            "barPercentage": 0.9,
                            "categoryPercentage": 0.8,
                            "data": data,
                            "type": "bar",
                            "label": "Dataset 1",
                            "borderColor": "",
                            "backgroundColor": "#794394",
                            "borderWidth": 3,
                            "hidden": false,
                            "xAxisID": "X1",
                            "yAxisID": null
                        },
                    ],
                    "labels": labels,
                },
                "options": {
                    "title": {
                        "display": false,
                        "position": "top",
                        "fontSize": 16,
                        "fontFamily": "sans-serif",
                        "fontColor": "#666666",
                        "fontStyle": "bold",
                        "padding": 10,
                        "lineHeight": 1.2,
                        "text": "Chart title"
                    },
                    "layout": {
                        "padding": {},
                        "left": 0,
                        "right": 0,
                        "top": 0,
                        "bottom": 0
                    },
                    "legend": {
                        "display": false,
                        "position": "top",
                        "align": "center",
                        "fullWidth": true,
                        "reverse": false,
                        "labels": {
                            "fontSize": 16,
                            "fontFamily": "sans-serif",
                            "fontColor": "#666666",
                            "fontStyle": "normal",
                            "padding": 10
                        }
                    },
                    "scales": {
                        "xAxes": [
                            {
                                "id": "X1",
                                "display": false,
                                "position": "bottom",
                                "type": "category",
                                "stacked": false,
                                "offset": true,
                                "time": {
                                    "unit": false,
                                    "stepSize": 1,
                                    "displayFormats": {
                                        "millisecond": "h:mm:ss.SSS a",
                                        "second": "h:mm:ss a",
                                        "minute": "h:mm a",
                                        "hour": "hA",
                                        "day": "MMM D",
                                        "week": "ll",
                                        "month": "MMM YYYY",
                                        "quarter": "[Q]Q - YYYY",
                                        "year": "YYYY"
                                    }
                                },
                                "distribution": "linear",
                                "gridLines": {
                                    "display": true,
                                    "color": "rgba(0, 0, 0, 0.1)",
                                    "borderDash": [
                                        0,
                                        0
                                    ],
                                    "lineWidth": 1,
                                    "drawBorder": true,
                                    "drawOnChartArea": true,
                                    "drawTicks": true,
                                    "tickMarkLength": 10,
                                    "zeroLineWidth": 1,
                                    "zeroLineColor": "rgba(0, 0, 0, 0.25)",
                                    "zeroLineBorderDash": [
                                        0,
                                        0
                                    ]
                                },
                                "angleLines": {
                                    "display": true,
                                    "color": "rgba(0, 0, 0, 0.1)",
                                    "borderDash": [
                                        0,
                                        0
                                    ],
                                    "lineWidth": 1
                                },
                                "pointLabels": {
                                    "display": true,
                                    "fontColor": "#666",
                                    "fontSize": 10,
                                    "fontStyle": "normal"
                                },
                                "ticks": {
                                    "display": true,
                                    "fontSize": 16,
                                    "fontFamily": "sans-serif",
                                    "fontColor": "#666666",
                                    "fontStyle": "normal",
                                    "padding": 0,
                                    "stepSize": null,
                                    "minRotation": 0,
                                    "maxRotation": 50,
                                    "mirror": false,
                                    "reverse": false
                                },
                                "scaleLabel": {
                                    "display": false,
                                    "labelString": "Axis label",
                                    "lineHeight": 1.2,
                                    "fontColor": "#666666",
                                    "fontFamily": "sans-serif",
                                    "fontSize": 16,
                                    "fontStyle": "normal",
                                    "padding": 4
                                }
                            }
                        ],
                        "yAxes": [
                            {
                                "id": "Y1",
                                "display": true,
                                "position": "left",
                                "type": "linear",
                                "stacked": false,
                                "offset": false,
                                "time": {
                                    "unit": false,
                                    "stepSize": 1,
                                    "displayFormats": {
                                        "millisecond": "h:mm:ss.SSS a",
                                        "second": "h:mm:ss a",
                                        "minute": "h:mm a",
                                        "hour": "hA",
                                        "day": "MMM D",
                                        "week": "ll",
                                        "month": "MMM YYYY",
                                        "quarter": "[Q]Q - YYYY",
                                        "year": "YYYY"
                                    }
                                },
                                "distribution": "linear",
                                "gridLines": {
                                    "display": true,
                                    "color": "rgba(0, 0, 0, 0.1)",
                                    "borderDash": [
                                        0,
                                        0
                                    ],
                                    "lineWidth": 1,
                                    "drawBorder": true,
                                    "drawOnChartArea": true,
                                    "drawTicks": true,
                                    "tickMarkLength": 10,
                                    "zeroLineWidth": 1,
                                    "zeroLineColor": "rgba(0, 0, 0, 0.25)",
                                    "zeroLineBorderDash": [
                                        0,
                                        0
                                    ]
                                },
                                "angleLines": {
                                    "display": true,
                                    "color": "rgba(0, 0, 0, 0.1)",
                                    "borderDash": [
                                        0,
                                        0
                                    ],
                                    "lineWidth": 1
                                },
                                "pointLabels": {
                                    "display": true,
                                    "fontColor": "#666",
                                    "fontSize": 10,
                                    "fontStyle": "normal"
                                },
                                "ticks": {
                                    "display": true,
                                    "fontSize": 16,
                                    "fontFamily": "sans-serif",
                                    "fontColor": "#666666",
                                    "fontStyle": "normal",
                                    "padding": 0,
                                    "min": wordsStart,
                                    "max": wordsEnd,
                                    "stepSize": chartStep,
                                    "minRotation": 0,
                                    "maxRotation": 50,
                                    "mirror": false,
                                    "reverse": false
                                },
                                "scaleLabel": {
                                    "display": false,
                                    "labelString": "Axis label",
                                    "lineHeight": 1.2,
                                    "fontColor": "#666666",
                                    "fontFamily": "sans-serif",
                                    "fontSize": 16,
                                    "fontStyle": "normal",
                                    "padding": 4
                                }
                            }
                        ]
                    },
                    "plugins": {
                        "datalabels": {
                            "display": false,
                            "align": "center",
                            "anchor": "center",
                            "backgroundColor": "#eee",
                            "borderColor": "#ddd",
                            "borderRadius": 6,
                            "borderWidth": 1,
                            "padding": 4,
                            "color": "#666666",
                            "font": {
                                "family": "sans-serif",
                                "size": 10,
                                "style": "normal"
                            }
                        },
                        "datalabelsZAxis": {
                            "enabled": false
                        },
                        "googleSheets": {},
                        "airtable": {},
                        "tickFormat": ""
                    },
                    "cutoutPercentage": 50,
                    "rotation": -1.5707963267948966,
                    "circumference": 6.283185307179586,
                    "startAngle": -1.5707963267948966
                }
            }
        )
        .setWidth(1200)
        .setHeight(600)
        .setBackgroundColor('#fff');

    return chart.toBinary()
}
