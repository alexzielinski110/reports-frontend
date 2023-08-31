import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, Select } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import axios from "axios";
import { useEffect, useState } from "react";
import Chart, { GoogleChartWrapper, GoogleViz } from "react-google-charts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { WithContext as ReactTags } from 'react-tag-input';
import { Canvg } from 'canvg';
import './Charts.css';

function Charts() {
    const apiUrl = 'http://localhost:3001/api'
    const fields = ['Name', 'Gender', 'Age', 'Point']

    const KeyCodes = {
        comma: 188,
        enter: 13
    }

    const delimiters = [KeyCodes.comma, KeyCodes.enter]

    const [chartWrapper, setChartWrapper] = useState<any>()
    const [chartType, setChartType] = useState<any>('PieChart')
    const [year, setYear] = useState<number>(2022)
    const [data, setData] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [recipients, setRecipients] = useState<Array<any>>([])
    const [open, setOpen] = useState<boolean>(false)

    const validateEmail = (email: any) => {
        return /^[a-z0-9.]{1,64}@[a-z0-9.]{1,64}$/i.test(email.toString())
    }

    const onChangeChartType = (event: any) => {
        setChartType(event.target.value as string)
        if (chartWrapper) {
            if (event.target.value == 'Table') {
                chartWrapper.setView({ columns: [0, 1, 2, 3] })
            } else {
                chartWrapper.setView({ columns: [0, 3] })
            }
        }
    }

    const onChangeYear = (event: any) => {
        setYear(event.target.value as number)
    }

    const onClickDownloadPDF = async (event: any) => {
        // get the viewed row index array
        const viewRows = chartWrapper.getDataTable().getViewRows()

        // initialize jsPDF
        const doc = new jsPDF()

        // define the columns we want and their titles
        const tableColumn = [fields]
        // define an empty array of rows
        const tableRows: Array<any> = []

        viewRows.forEach((val: number) => {
            tableRows.push(data[val + 1])
        })

        autoTable(doc, {
            head: tableColumn,
            body: tableRows
        })

        if (chartType != 'Table') {
            let svg: any = document.querySelector('#reactgooglegraph-1 svg')?.outerHTML
            svg = svg.replace(/\r?\n|\r/g, '').trim()

            let canvas = document.createElement('canvas')
            let context: any = canvas.getContext('2d')

            // context.clearRect(0, 0, canvas.width, canvas.height)
            let v = await Canvg.from(context, svg)
            v.start()

            const imgData = canvas.toDataURL('image/png')

            v.stop()

            doc.addImage(imgData, 'PNG', 0, viewRows.length * 15, 220, 110)
        }

        doc.save(`report_${year}.pdf`)
    }

    const onClickSendEmail = async (event: any) => {
        let to = new Array()
        recipients.forEach((row) => {
            to.push(row.text)
        })

        // get the viewed row index array
        const viewRows = chartWrapper.getDataTable().getViewRows()

        // define the columns we want and their titles
        const tableColumn = [fields]
        // define an empty array of rows
        const tableRows: Array<any> = []

        viewRows.forEach((val: number) => {
            tableRows.push(data[val + 1])
        })

        let chart = ''
        if (chartType != 'Table') {
            let svg: any = document.querySelector('#reactgooglegraph-1 svg')?.outerHTML
            svg = svg.replace(/\r?\n|\r/g, '').trim()

            let canvas = document.createElement('canvas')
            let context: any = canvas.getContext('2d')

            // context.clearRect(0, 0, canvas.width, canvas.height)
            let v = await Canvg.from(context, svg)
            v.start()

            chart = canvas.toDataURL('image/png')

            v.stop()
        }

        axios.post(`${apiUrl}/email/send`, { to: to, year: year, head: tableColumn, body: tableRows, chart: chart }).then((resp) => {
            setOpen(false)
        })
    }

    const onDeleteRecipients = (i: number) => {
        setRecipients(recipients.filter((recipient, index) => index !== i))
    }

    const onAddRecipients = (recipient: any) => {
        if (validateEmail(recipient.text)) {
            setRecipients([...recipients, recipient])
        } else {
            alert('Please input the email address correctly.')
        }
    }

    useEffect(() => {
        const getData = () => {
            setLoading(true)

            axios.get(`${apiUrl}/performance/year/${year}`).then((resp) => {
                const { data } = resp

                let arr = new Array(fields)
                data.forEach((row: any) => {
                    arr.push([
                        (row.Employee.first_name + ' ' + row.Employee.last_name).trim(),
                        row.Employee.sex,
                        parseInt(row.Employee.age),
                        parseFloat(row.point)
                    ])
                })

                setData(arr)
            }).catch((err) => console.log(err))

            setLoading(false)
        }

        getData()
    }, [year])

    return (
        <div style={{ width: 700 }}>
            <Box component="form" width={700}>
                <FormControl margin="normal" component="fieldset" variant="standard">
                    <InputLabel id="chart-type-select-standard-label">Chart Type</InputLabel>
                    <Select
                        labelId="chart-type-select-standard-label"
                        id="chart-type-select-standard"
                        value={chartType}
                        label="Chart Type"
                        onChange={onChangeChartType}
                    >
                        <MenuItem value="LineChart">Line Chart</MenuItem>
                        <MenuItem value="ScatterChart">Scatter Chart</MenuItem>
                        <MenuItem value="PieChart">Pie Chart</MenuItem>
                        <MenuItem value="Table">Table</MenuItem>
                    </Select>
                </FormControl>
                <FormControl margin="normal" component="fieldset" variant="standard" style={{ marginLeft: 10 }}>
                    <InputLabel id="year-select-standard-label">Year</InputLabel>
                    <Select
                        labelId="year-select-standard-label"
                        id="year-select-standard"
                        value={year}
                        label="Year"
                        onChange={onChangeYear}
                    >
                        <MenuItem value={2022}>2022</MenuItem>
                        <MenuItem value={2021}>2021</MenuItem>
                        <MenuItem value={2020}>2020</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Container style={{ width: 700, marginTop: 10 }}>
                {
                    !loading ?
                        <Chart
                            chartType={chartType}
                            chartWrapperParams={{
                                view: { columns: [0, 3] }
                            }}
                            data={data}
                            options={{
                                title: 'Yearly Performance Assessment',
                                is3D: true,
                                width: 700,
                                height: 400
                            }}
                            chartPackages={['corechart', 'table', 'gauge', 'controls']}
                            controls={[{
                                controlType: 'CategoryFilter',
                                controlID: 'gender',
                                options: {
                                    filterColumnIndex: 1,
                                    ui: {
                                        labelStacking: 'vertical',
                                        label: 'Gender:',
                                        allowTyping: false,
                                        allowMultiple: false,
                                        caption: 'Choose...',
                                        css: {
                                            width: 150
                                        }
                                    }
                                }
                            }, {
                                controlType: 'NumberRangeFilter',
                                controlID: 'age',
                                options: {
                                    filterColumnIndex: 2,
                                    ui: {
                                        labelStacking: 'vertical',
                                        label: 'Age:',
                                    }
                                }
                            }, {
                                controlType: 'NumberRangeFilter',
                                controlID: 'point',
                                options: {
                                    filterColumnIndex: 3,
                                    ui: {
                                        labelStacking: 'vertical',
                                        label: 'Point:',
                                        css: {
                                            width: 150,
                                            display: 'inline'
                                        }
                                    }
                                }
                            }]}
                            getChartWrapper={(chartWrapper: GoogleChartWrapper, google: GoogleViz) => {
                                setChartWrapper(chartWrapper)
                            }}
                        /> : <CircularProgress />
                }
            </Container>

            <div style={{ width: 700, marginTop: 10 }}>
                <FormControl margin="normal" component="fieldset" variant="standard">
                    <Button variant="contained" color="primary" onClick={onClickDownloadPDF}>Download as PDF</Button>
                </FormControl>
                <FormControl margin="normal" component="fieldset" variant="standard" style={{ marginLeft: 10 }}>
                    <Button variant="contained" color="primary" onClick={() => {
                        setRecipients([])
                        setOpen(true)
                    }}>Send as Email</Button>
                </FormControl>
            </div>

            <Dialog open={open} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Send as email with PDF attachment</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To send the email, please add the receiver's email address here.
                        You can add multiple addresses.
                    </DialogContentText>
                    <ReactTags
                        tags={recipients}
                        delimiters={delimiters}
                        handleDelete={onDeleteRecipients}
                        handleAddition={onAddRecipients}
                        placeholder="Please enter the email address"></ReactTags>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" disabled={recipients.length == 0} onClick={onClickSendEmail}>
                        Send
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default Charts;