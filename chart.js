const QuickChart = require('quickchart-js');

function getChart() {
 const chart = new QuickChart();

chart
    .setConfig({
        "type": "line",
        "data": {
            "datasets": [
                {
                    "fill": false,
                    "spanGaps": false,
                    "lineTension": 0,
                    "pointRadius": 0,
                    "pointHoverRadius": 0,
                    "pointStyle": "circle",
                    "borderDash": [
                        0,
                        0
                    ],
                    "barPercentage": 0.9,
                    "categoryPercentage": 0.8,
                    "data": [
                        1000,
                        1200,
                        2000,
                        2000,
                        3500,
                        6000,
                        6000
                    ],
                    "type": "line",
                    "label": "Words Written",
                    "borderColor": "#9053af",
                    "backgroundColor": "#4E79A733",
                    "borderWidth": 3,
                    "hidden": false,
                    "yAxisID": "Y1"
                },
                {
                    "fill": true,
                    "spanGaps": false,
                    "lineTension": 0.4,
                    "pointRadius": 0,
                    "pointHoverRadius": 0,
                    "pointStyle": "circle",
                    "borderDash": [
                        0,
                        0
                    ],
                    "barPercentage": 0.9,
                    "categoryPercentage": 0.8,
                    "data": [
                        1000,
                        2000,
                        3000,
                        4000,
                        5000,
                        6000
                    ],
                    "type": "line",
                    "label": "Expected",
                    "borderColor": "#4e79a7",
                    "backgroundColor": "rgba(80, 123, 144, 0.2)",
                    "borderWidth": 3,
                    "hidden": false
                }
            ],
            "labels": [
                "Day 1",
                "Day 2",
                "Day 3",
                "Day 4",
                "Day 5",
                "Day 6"
            ]
        },
        "options": {
            "title": {
                "display": false,
                "position": "top",
                "fontSize": 12,
                "fontFamily": "sans-serif",
                "fontColor": "#666666",
                "fontStyle": "bold",
                "padding": 10,
                "lineHeight": 1.2,
                "text": "Chart title"
            },
            "layout": {
                "padding": {
                    "left": 12,
                    "bottom": 12,
                    "top": 12,
                    "right": 12
                },
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
                    "fontSize": 12,
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
                            "display": false,
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
                            "display": false,
                            "fontSize": 12,
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
                            "fontSize": 12,
                            "fontStyle": "normal",
                            "padding": 4
                        }
                    }
                ],
                "yAxes": [
                    {
                        "id": "Y1",
                        "display": true,
                        "position": "right",
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
                            "color": "rgba(196, 196, 196, 0.1)",
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
                            "fontSize": 12,
                            "fontFamily": "sans-serif",
                            "fontColor": "#666666",
                            "fontStyle": "normal",
                            "padding": 0,
                            "min": 0,
                            "max": 6000,
                            "stepSize": 3000,
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
                            "fontSize": 12,
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
                    "anchor": "end",
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
    })
    .setWidth(800)
    .setHeight(400)
    .setBackgroundColor('#2a394d');

    return chart.toBinary()
}

module.exports = {
    getChart
}