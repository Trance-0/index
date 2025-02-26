'use client'

import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../navbar';
import Footer from '../footer';

export default function RandomArrayGenerator() {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(100);
    const [is2D, setIs2D] = useState(false);
    const [multiline, setMultiline] = useState(true);
    const [generatedArray, setGeneratedArray] = useState([]);

    const generateRandomArray = () => {
        if (is2D) {
            // Generate 2D array
            const newArray = (maxValue%1===0)&&(minValue%1===0)?Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => 
                    Math.floor(Math.random() * (maxValue - minValue + 1) + minValue)
                )
            ):Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => 
                    Math.random() * (maxValue - minValue + 1) + minValue
                )
            );
            setGeneratedArray(newArray);
        } else {
            // Generate 1D array
            const newArray = (maxValue%1===0)&&(minValue%1===0)?Array.from({ length: rows }, () =>
                Math.floor(Math.random() * (maxValue - minValue + 1) + minValue)
            ):Array.from({ length: rows }, () =>
                Math.random() * (maxValue - minValue + 1) + minValue
            );
            setGeneratedArray(newArray);
        }
    };

    const formatArray = (arr) => {
        if (is2D) {
            const formattedRows = arr.map(row => `[${row.join(', ')}]`);
            return multiline ? '[\n' + formattedRows.join(',\n') + '\n]' : '[' + formattedRows.join(', ') + ']';
        }
        return multiline ? '[\n' + arr.join(',') + '\n]' : '[' + arr.join(', ') + ']';
    };

    const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');
    const copyToClipboard = () => {
        navigator.clipboard.writeText(formatArray(generatedArray));
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>Random Array Generator</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Navbar />

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-8">Random Array Generator</h1>
                    <div className="bg-secondary rounded-lg shadow-md p-6 max-w-2xl mx-auto">
                        <div className="space-y-4">


                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {is2D ? 'Number of Rows' : 'Array Length'}
                                </label>
                                <input
                                    type="number"
                                    value={rows}
                                    onChange={(e) => setRows(Math.max(1, parseInt(e.target.value)))}
                                    className="w-full p-2 border rounded"
                                    placeholder={is2D ? "Enter number of rows" : "Enter array length"}
                                    min="1"
                                />
                            </div>

                            {is2D && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Number of Columns</label>
                                    <input
                                        type="number"
                                        value={cols}
                                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value)))}
                                        className="w-full p-2 border rounded"
                                        placeholder="Enter number of columns"
                                        min="1"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Minimum Value</label>
                                <input
                                    value={minValue}
                                    onChange={(e) => {
                                        if (e.target.value==="" || !e.target.value.match(/^-?\d*(\.\d+)?$/)) return;
                                        setMinValue(parseFloat(e.target.value))}}
                                    className="w-full p-2 border rounded"
                                    placeholder="Enter minimum value"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Maximum Value</label>
                                <input
                                    value={maxValue}
                                    onChange={(e) => {
                                        if (e.target.value==="" || !e.target.value.match(/^-?\d*(\.\d+)?$/)) return;
                                        setMaxValue(parseFloat(e.target.value))}}
                                    className="w-full p-2 border rounded"
                                    placeholder="Enter maximum value"
                                />
                            </div><div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is2D"
                                        checked={is2D}
                                        onChange={(e) => setIs2D(e.target.checked)}
                                        className="rounded"
                                    />
                                    <label htmlFor="is2D" className="text-sm font-medium">
                                        Generate 2D Array
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="multiline"
                                        checked={multiline}
                                        onChange={(e) => setMultiline(e.target.checked)}
                                        className="rounded"
                                    />
                                    <label htmlFor="multiline" className="text-sm font-medium">
                                        Multiline Output
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={generateRandomArray}
                                className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                Generate Random Array
                            </button>

                            {generatedArray.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-lg font-medium">Generated Array:</h2>
                                        <button
                                            onClick={copyToClipboard}
                                            className="bg-secondary text-secondary px-3 py-1 rounded hover:bg-gray-200"
                                        >
                                            {copyButtonText}
                                        </button>
                                    </div>
                                    <div className="p-4 bg-secondary border rounded">
                                        <pre className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                                            {formatArray(generatedArray)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
