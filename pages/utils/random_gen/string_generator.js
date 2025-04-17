'use client'

import { useState } from 'react';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default function RandomStringGenerator() {
    const [length, setLength] = useState(16);
    const [charset, setCharset] = useState(DEFAULT_CHARSET);
    const [generatedString, setGeneratedString] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

    const generateRandomString = () => {
        let result = '';
        const charsetLength = charset.length;
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charsetLength);
            result += charset[randomIndex];
        }
        setGeneratedString(result);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedString);
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Random String Generator</h1>
            <div className="bg-secondary rounded-lg shadow-md p-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Character Set</label>
                        <input
                            type="text"
                            value={charset}
                            onChange={(e) => setCharset(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter character set"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">String Length</label>
                        <input
                            type="number"
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full p-2 border rounded"
                            placeholder="Enter string length"
                        />
                    </div>

                    <button
                        onClick={generateRandomString}
                        className="w-full button-info text-white p-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Generate Random String
                    </button>

                    {generatedString && (
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-medium">Generated String:</h2>
                                <button
                                    onClick={copyToClipboard}
                                    className="bg-secondary text-secondary px-3 py-1 rounded hover:bg-gray-200"
                                >
                                    {copyButtonText}
                                </button>
                            </div>
                            <div className="p-4 bg-secondary border rounded">
                                <p className="text-lg font-mono break-all">{generatedString}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
