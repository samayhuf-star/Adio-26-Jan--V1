import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileCheck, AlertCircle, CheckCircle, X, FileText, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import Papa from 'papaparse';

interface ComparisonResult {
  type: 'match' | 'difference' | 'missing' | 'extra';
  field: string;
  rowIndex: number;
  masterValue: string;
  uploadedValue: string;
  message: string;
}

interface ComparisonSummary {
  totalRows: number;
  matchedRows: number;
  differentRows: number;
  missingRows: number;
  extraRows: number;
  differences: ComparisonResult[];
}

const MASTER_CSV_PATH = '/Fiuti_campaing_111.csv';

export const CSVCompare: React.FC = () => {
  const [masterData, setMasterData] = useState<any[]>([]);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load master CSV on component mount
  useEffect(() => {
    loadMasterCSV();
  }, []);

  const loadMasterCSV = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(MASTER_CSV_PATH);
      
      if (!response.ok) {
        throw new Error('Master CSV file not found. Please ensure the file is accessible.');
      }
      
      const text = await response.text();
      const parsed = Papa.parse(text, { 
        header: true, 
        skipEmptyLines: false,
        transformHeader: (header) => header.trim()
      });
      
      setMasterData(parsed.data as any[]);
      setError(null);
    } catch (err: any) {
      console.error('Error loading master CSV:', err);
      setError(`Could not load master CSV: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = Papa.parse(text, { 
          header: true, 
          skipEmptyLines: false,
          transformHeader: (header) => header.trim()
        });
        
        setUploadedData(parsed.data as any[]);
        setIsLoading(false);
      } catch (err: any) {
        setError(`Error parsing uploaded file: ${err.message}`);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const compareCSVs = () => {
    if (masterData.length === 0) {
      setError('Master CSV is not loaded. Please ensure the master file is available.');
      return;
    }

    if (uploadedData.length === 0) {
      setError('Please upload a CSV file to compare.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const differences: ComparisonResult[] = [];
      
      // Filter out completely empty rows
      const masterRows = masterData.filter(row => {
        return Object.values(row).some(val => String(val || '').trim() !== '');
      });
      const uploadedRows = uploadedData.filter(row => {
        return Object.values(row).some(val => String(val || '').trim() !== '');
      });

      const masterHeaders = masterRows.length > 0 ? Object.keys(masterRows[0] || {}) : [];
      const uploadedHeaders = uploadedRows.length > 0 ? Object.keys(uploadedRows[0] || {}) : [];
      
      // Compare headers
      const missingHeaders = masterHeaders.filter(h => !uploadedHeaders.includes(h));
      const extraHeaders = uploadedHeaders.filter(h => !masterHeaders.includes(h));
      
      missingHeaders.forEach(header => {
        differences.push({
          type: 'missing',
          field: header,
          rowIndex: -1,
          masterValue: header,
          uploadedValue: '',
          message: `Missing header: "${header}"`
        });
      });

      extraHeaders.forEach(header => {
        differences.push({
          type: 'extra',
          field: header,
          rowIndex: -1,
          masterValue: '',
          uploadedValue: header,
          message: `Extra header: "${header}"`
        });
      });

      // Compare rows
      const maxRows = Math.max(masterRows.length, uploadedRows.length);
      let matchedRows = 0;
      let differentRows = 0;
      let missingRows = 0;
      let extraRows = 0;

      for (let i = 0; i < maxRows; i++) {
        const masterRow = masterRows[i];
        const uploadedRow = uploadedRows[i];

        if (!masterRow && uploadedRow) {
          // Extra row in uploaded
          extraRows++;
          const rowPreview = Object.entries(uploadedRow)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          differences.push({
            type: 'extra',
            field: 'ROW',
            rowIndex: i + 1,
            masterValue: '',
            uploadedValue: rowPreview + (Object.keys(uploadedRow).length > 3 ? '...' : ''),
            message: `Extra row at index ${i + 1}`
          });
          continue;
        }

        if (masterRow && !uploadedRow) {
          // Missing row in uploaded
          missingRows++;
          const rowPreview = Object.entries(masterRow)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          differences.push({
            type: 'missing',
            field: 'ROW',
            rowIndex: i + 1,
            masterValue: rowPreview + (Object.keys(masterRow).length > 3 ? '...' : ''),
            uploadedValue: '',
            message: `Missing row at index ${i + 1}`
          });
          continue;
        }

        if (!masterRow && !uploadedRow) {
          continue;
        }

        // Compare row values
        let rowMatches = true;
        const rowDifferences: ComparisonResult[] = [];

        masterHeaders.forEach(header => {
          const masterValue = String(masterRow[header] || '').trim();
          const uploadedValue = String(uploadedRow[header] || '').trim();

          // Only compare if at least one value is non-empty
          if (masterValue !== uploadedValue && (masterValue !== '' || uploadedValue !== '')) {
            rowMatches = false;
            rowDifferences.push({
              type: 'difference',
              field: header,
              rowIndex: i + 1,
              masterValue: masterValue || '(empty)',
              uploadedValue: uploadedValue || '(empty)',
              message: `Row ${i + 1}, Column "${header}": Expected "${masterValue || '(empty)'}", Found "${uploadedValue || '(empty)'}"`
            });
          }
        });

        if (rowMatches) {
          matchedRows++;
        } else {
          differentRows++;
          differences.push(...rowDifferences);
        }
      }

      const summary: ComparisonSummary = {
        totalRows: maxRows,
        matchedRows,
        differentRows,
        missingRows,
        extraRows,
        differences
      };

      setComparisonResult(summary);
    } catch (err: any) {
      setError(`Error comparing CSVs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    if (!comparisonResult) return;

    const logs = [
      'CSV Comparison Logs',
      '==================',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Summary:',
      `- Total Rows: ${comparisonResult.totalRows}`,
      `- Matched Rows: ${comparisonResult.matchedRows}`,
      `- Different Rows: ${comparisonResult.differentRows}`,
      `- Missing Rows: ${comparisonResult.missingRows}`,
      `- Extra Rows: ${comparisonResult.extraRows}`,
      '',
      'Detailed Differences:',
      '=====================',
      ''
    ];

    comparisonResult.differences.forEach((diff, index) => {
      logs.push(`${index + 1}. [${diff.type.toUpperCase()}] ${diff.message}`);
      if (diff.masterValue) {
        logs.push(`   Master: ${diff.masterValue}`);
      }
      if (diff.uploadedValue) {
        logs.push(`   Uploaded: ${diff.uploadedValue}`);
      }
      logs.push('');
    });

    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csv-comparison-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetComparison = () => {
    setUploadedData([]);
    setUploadedFileName('');
    setComparisonResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-6 h-6" />
            CSV Comparison Tool
          </CardTitle>
          <CardDescription>
            Compare your generated CSV with the master sheet to identify differences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Master Sheet</CardTitle>
                <CardDescription>Default reference CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Fiuti_campaing_111.csv</p>
                    <p className="text-xs text-muted-foreground">
                      {masterData.length > 0 ? `${masterData.length} rows loaded` : 'Not loaded'}
                    </p>
                  </div>
                  {masterData.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                {masterData.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMasterCSV}
                    className="mt-2 w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Master CSV
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upload CSV</CardTitle>
                <CardDescription>Your generated CSV file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFileName || 'Click to upload CSV'}
                    </p>
                  </label>
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{uploadedFileName}</span>
                      <span className="text-xs text-muted-foreground">
                        {uploadedData.length} rows
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetComparison}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Compare Button */}
          <div className="flex justify-center">
            <Button
              onClick={compareCSVs}
              disabled={isLoading || masterData.length === 0 || uploadedData.length === 0}
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Check Comparison
                </>
              )}
            </Button>
          </div>

          {/* Summary Section */}
          {comparisonResult && (
            <Card>
              <CardHeader>
                <CardTitle>Comparison Summary</CardTitle>
                <CardDescription>Overview of differences found</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{comparisonResult.totalRows}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-indigo-50">
                    <p className="text-2xl font-bold text-indigo-600">
                      {comparisonResult.matchedRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Matched</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <p className="text-2xl font-bold text-yellow-600">
                      {comparisonResult.differentRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Different</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">
                      {comparisonResult.missingRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Missing</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">
                      {comparisonResult.extraRows}
                    </p>
                    <p className="text-sm text-muted-foreground">Extra</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={exportLogs} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Side-by-Side Comparison View */}
          {comparisonResult && masterData.length > 0 && uploadedData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Side-by-Side Comparison</CardTitle>
                <CardDescription>
                  Compare rows from master sheet and uploaded CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {/* Master Sheet Column */}
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-background z-10 pb-2 border-b">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Master Sheet
                      </h3>
                    </div>
                    {masterData.slice(0, 50).map((row, index) => {
                      const rowDiff = comparisonResult.differences.find(
                        d => d.rowIndex === index + 1 && d.type === 'difference'
                      );
                      const isDifferent = rowDiff !== undefined;
                      return (
                        <div
                          key={index}
                          className={`p-3 border rounded text-xs ${
                            isDifferent ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30'
                          }`}
                        >
                          <div className="font-mono space-y-1">
                            {Object.entries(row).slice(0, 5).map(([key, value]) => (
                              <div key={key} className="truncate">
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span className={isDifferent && rowDiff?.field === key ? 'text-red-600 font-bold' : ''}>
                                  {String(value || '').substring(0, 50)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {Object.keys(row).length > 5 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{Object.keys(row).length - 5} more fields
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {masterData.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Showing first 50 of {masterData.length} rows
                      </p>
                    )}
                  </div>

                  {/* Uploaded CSV Column */}
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-background z-10 pb-2 border-b">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Uploaded CSV
                      </h3>
                    </div>
                    {uploadedData.slice(0, 50).map((row, index) => {
                      const rowDiff = comparisonResult.differences.find(
                        d => d.rowIndex === index + 1 && d.type === 'difference'
                      );
                      const isDifferent = rowDiff !== undefined;
                      return (
                        <div
                          key={index}
                          className={`p-3 border rounded text-xs ${
                            isDifferent ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30'
                          }`}
                        >
                          <div className="font-mono space-y-1">
                            {Object.entries(row).slice(0, 5).map(([key, value]) => (
                              <div key={key} className="truncate">
                                <span className="text-muted-foreground">{key}:</span>{' '}
                                <span className={isDifferent && rowDiff?.field === key ? 'text-red-600 font-bold' : ''}>
                                  {String(value || '').substring(0, 50)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {Object.keys(row).length > 5 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{Object.keys(row).length - 5} more fields
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {uploadedData.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Showing first 50 of {uploadedData.length} rows
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Differences */}
          {comparisonResult && comparisonResult.differences.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Detailed Differences Log</CardTitle>
                  <CardDescription>
                    {comparisonResult.differences.length} difference(s) found - Review what needs to be fixed
                  </CardDescription>
                </div>
                <Button onClick={exportLogs} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comparisonResult.differences.map((diff, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        diff.type === 'match'
                          ? 'bg-green-50 border-green-200'
                          : diff.type === 'difference'
                          ? 'bg-yellow-50 border-yellow-200'
                          : diff.type === 'missing'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {diff.type === 'match' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-sm font-medium">{diff.message}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            diff.type === 'match'
                              ? 'bg-green-100 text-green-700'
                              : diff.type === 'difference'
                              ? 'bg-yellow-100 text-yellow-700'
                              : diff.type === 'missing'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {diff.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        {diff.masterValue && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Master:</p>
                            <p className="font-mono text-xs bg-white p-2 rounded border break-words">
                              {diff.masterValue}
                            </p>
                          </div>
                        )}
                        {diff.uploadedValue && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Uploaded:</p>
                            <p className="font-mono text-xs bg-white p-2 rounded border break-words">
                              {diff.uploadedValue}
                            </p>
                          </div>
                        )}
                      </div>
                      {diff.type === 'difference' && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                          <p className="font-semibold text-orange-800">Action Required:</p>
                          <p className="text-orange-700">
                            Update the uploaded CSV to match the master value: <code className="bg-white px-1 rounded">{diff.masterValue}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

