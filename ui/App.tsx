import React, { useState } from "react";
import "./App.css";
import Papa from "papaparse";

interface PipelineResult {
	entryId: string;
	response_text: string;
	carry_in: boolean;
	updated_profile: {
		entry_count: number;
		dominant_vibe: string;
		top_themes: string[];
		trait_pool: string[];
	};
	execution_time: number;
	total_tokens: number;
	total_cost: number;
}

interface BulkProcessResult {
	index: number;
	transcript: string;
	entryId?: string;
	response_text?: string;
	carry_in?: boolean;
	execution_time?: number;
	total_tokens?: number;
	total_cost?: number;
	error?: string;
}

interface BulkProcessResponse {
	success: boolean;
	processed_count: number;
	results: BulkProcessResult[];
	final_profile: {
		entry_count: number;
		dominant_vibe: string;
		top_themes: string[];
		trait_pool: string[];
	};
	summary: {
		total_cost: number;
		total_time: number;
		average_time: number;
	};
}

function App() {
	const [transcript, setTranscript] = useState("");
	const [result, setResult] = useState<PipelineResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// CSV Upload state
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [bulkResults, setBulkResults] = useState<BulkProcessResponse | null>(
		null
	);
	const [bulkLoading, setBulkLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!transcript.trim()) return;

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const response = await fetch("/api/pipeline", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ transcript }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setResult(data.result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleExample = (exampleText: string) => {
		setTranscript(exampleText);
	};

	const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type === "text/csv") {
			setCsvFile(file);
		} else {
			setError("Please select a valid CSV file");
		}
	};

	const parseCsvContent = (csv: string): { transcript: string }[] => {
		const { data } = Papa.parse<{ transcript_user?: string }>(csv, {
			header: true, // first row = column names
			skipEmptyLines: true,
		});

		return data
			.map((r) => r.transcript_user?.trim()) // use the header name
			.filter(Boolean) // drop blanks / undefined
			.slice(0, 99) // API limit
			.map((t) => ({ transcript: t! })); // shape for POST body
	};

	const handleBulkProcess = async () => {
		if (!csvFile) return;

		setBulkLoading(true);
		setError(null);
		setBulkResults(null);

		try {
			const csvContent = await csvFile.text();
			const entries = parseCsvContent(csvContent);

			if (entries.length === 0) {
				throw new Error("No valid entries found in CSV file");
			}

			if (entries.length > 99) {
				throw new Error("Maximum 99 entries allowed");
			}

			const response = await fetch("/api/bulk-process", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ entries }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setBulkResults(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Bulk processing failed"
			);
		} finally {
			setBulkLoading(false);
		}
	};

	return (
		<div className="app">
			<header className="header">
				<h1>🧠 Sentari Pipeline</h1>
				<p>From Transcript to Empathy - AI-Powered Diary Analysis</p>
			</header>

			<main className="main">
				<div className="input-section">
					<form onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="transcript">
								📝 Enter your diary transcript:
							</label>
							<textarea
								id="transcript"
								value={transcript}
								onChange={(e) => setTranscript(e.target.value)}
								placeholder=""
								rows={4}
								disabled={loading}
							/>
						</div>

						<div className="examples">
							<p>Try these examples:</p>
							<button
								type="button"
								onClick={() =>
									handleExample(
										"I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
									)
								}
								className="example-btn"
							>
								Work-Life Balance Conflict
							</button>
							<button
								type="button"
								onClick={() =>
									handleExample(
										"I'm excited to learn machine learning and build something innovative that helps people!"
									)
								}
								className="example-btn"
							>
								Positive Growth Mindset
							</button>
							<button
								type="button"
								onClick={() =>
									handleExample(
										"I'm feeling overwhelmed by all the intern feedback sessions, but I'm also proud of the progress they're making."
									)
								}
								className="example-btn"
							>
								Leadership Complexity
							</button>
						</div>

						<button
							type="submit"
							disabled={loading || !transcript.trim()}
							className="submit-btn"
						>
							{loading ? "🔄 Processing..." : "🚀 Run Pipeline"}
						</button>
					</form>
				</div>

				<div className="csv-upload-section">
					<h3>📊 Bulk CSV Processing</h3>
					<p>
						Upload a CSV file with up to 99 diary entries to process
						them all through the pipeline.{" "}
						<strong>
							The first row must be a header and will be skipped.
							Transcripts should be in the second column titled
							'transcript_user'.
						</strong>
					</p>

					<div className="csv-upload-form">
						<div className="form-group">
							<label htmlFor="csv-file">
								📁 Select CSV File:
							</label>
							<input
								id="csv-file"
								type="file"
								accept=".csv"
								onChange={handleCsvUpload}
								disabled={bulkLoading}
								className="csv-input"
							/>
							{csvFile && (
								<div className="file-info">
									Selected: {csvFile.name} (
									{(csvFile.size / 1024).toFixed(1)} KB)
								</div>
							)}
						</div>

						<div className="csv-format-info">
							<p>
								<strong>CSV Format Requirements:</strong>
							</p>
							<ul>
								<li>
									<strong>First row must be a header</strong>{" "}
									(will be skipped during processing)
								</li>
								<li>
									<strong>
										Second column must be titled
										'transcript_user'
									</strong>{" "}
									and contain the diary entries
								</li>
								<li>Transcripts can be quoted or unquoted</li>
								<li>Maximum 99 entries (excluding header)</li>
							</ul>
							<p>
								<strong>Example CSV:</strong>
							</p>
							<code>
								id,transcript_user,other_column
								<br />
								1,"I'm feeling excited about this new
								project!",data
								<br />
								2,"Work has been stressful but I'm
								managing.",data
								<br />
								3,"Today was a great day for learning.",data
								<br />
								4,I had a wonderful conversation with my team
								today.,data
							</code>
						</div>

						<button
							onClick={handleBulkProcess}
							disabled={!csvFile || bulkLoading}
							className="bulk-process-btn"
						>
							{bulkLoading
								? "🔄 Processing CSV..."
								: "🚀 Process CSV Entries"}
						</button>
					</div>
				</div>

				{error && (
					<div className="error">
						<h3>❌ Error</h3>
						<p>{error}</p>
					</div>
				)}

				{/* Manual Entry Results */}
				{result && (
					<div className="bulk-results">
						<h3>📝 Manual Entry Results</h3>

						<div className="manual-summary">
							<div className="summary-stats">
								<div className="stat">
									<span className="label">Processed:</span>
									<span className="value">1 entry</span>
								</div>
								<div className="stat">
									<span className="label">Total Cost:</span>
									<span className="value">
										${result.total_cost.toFixed(4)}
									</span>
								</div>
								<div className="stat">
									<span className="label">Total Time:</span>
									<span className="value">
										{result.execution_time}ms
									</span>
								</div>
							</div>
						</div>

						<div className="final-profile">
							<h4>👤 Updated Profile</h4>
							<div className="profile-stats">
								<div className="stat">
									<span className="label">
										Total Entries:
									</span>
									<span className="value">
										{result.updated_profile.entry_count}
									</span>
								</div>
								<div className="stat">
									<span className="label">
										Dominant Vibe:
									</span>
									<span className="value">
										{result.updated_profile.dominant_vibe}
									</span>
								</div>
								<div className="stat">
									<span className="label">Top Themes:</span>
									<span className="value">
										{result.updated_profile.top_themes.join(
											", "
										)}
									</span>
								</div>
								<div className="stat">
									<span className="label">Traits:</span>
									<span className="value">
										{result.updated_profile.trait_pool.join(
											", "
										)}
									</span>
								</div>
							</div>
						</div>

						<div className="manual-entries">
							<h4>📋 Entry Result</h4>
							<div className="entries-list">
								<div className="entry-result success">
									<div className="entry-header">
										<span className="entry-number">#1</span>
										<span className="entry-status">
											✅ Success
										</span>
									</div>
									<div className="entry-transcript">
										"{transcript.substring(0, 100)}
										{transcript.length > 100 ? "..." : ""}"
									</div>
									<div className="entry-details">
										<div className="entry-response">
											Response: "{result.response_text}"
										</div>
										<div className="entry-meta">
											Carry-in:{" "}
											{result.carry_in ? "✅" : "❌"} •
											Cost: $
											{result.total_cost.toFixed(4)} •
											Time: {result.execution_time}ms
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Bulk CSV Processing Results */}
				{bulkResults && (
					<div className="bulk-results">
						<h3>📊 Bulk CSV Processing Results</h3>

						<div className="bulk-summary">
							<div className="summary-stats">
								<div className="stat">
									<span className="label">Processed:</span>
									<span className="value">
										{bulkResults.processed_count} entries
									</span>
								</div>
								<div className="stat">
									<span className="label">Total Cost:</span>
									<span className="value">
										$
										{bulkResults.summary.total_cost.toFixed(
											4
										)}
									</span>
								</div>
								<div className="stat">
									<span className="label">Total Time:</span>
									<span className="value">
										{bulkResults.summary.total_time}ms
									</span>
								</div>
								<div className="stat">
									<span className="label">Avg Time:</span>
									<span className="value">
										{bulkResults.summary.average_time.toFixed(
											1
										)}
										ms
									</span>
								</div>
							</div>
						</div>

						<div className="final-profile">
							<h4>👤 Final Profile After Processing</h4>
							<div className="profile-stats">
								<div className="stat">
									<span className="label">
										Total Entries:
									</span>
									<span className="value">
										{bulkResults.final_profile.entry_count}
									</span>
								</div>
								<div className="stat">
									<span className="label">
										Dominant Vibe:
									</span>
									<span className="value">
										{
											bulkResults.final_profile
												.dominant_vibe
										}
									</span>
								</div>
								<div className="stat">
									<span className="label">Top Themes:</span>
									<span className="value">
										{bulkResults.final_profile.top_themes.join(
											", "
										)}
									</span>
								</div>
								<div className="stat">
									<span className="label">Traits:</span>
									<span className="value">
										{bulkResults.final_profile.trait_pool.join(
											", "
										)}
									</span>
								</div>
							</div>
						</div>

						<div className="bulk-entries">
							<h4>📋 Individual Entry Results</h4>
							<div className="entries-list">
								{bulkResults.results.map((result, index) => (
									<div
										key={index}
										className={`entry-result ${
											result.error ? "error" : "success"
										}`}
									>
										<div className="entry-header">
											<span className="entry-number">
												#{result.index}
											</span>
											<span className="entry-status">
												{result.error
													? "❌ Failed"
													: "✅ Success"}
											</span>
										</div>
										<div className="entry-transcript">
											"
											{result.transcript.substring(
												0,
												100
											)}
											{result.transcript.length > 100
												? "..."
												: ""}
											"
										</div>
										{result.error ? (
											<div className="entry-error">
												Error: {result.error}
											</div>
										) : (
											<div className="entry-details">
												<div className="entry-response">
													Response: "
													{result.response_text}"
												</div>
												<div className="entry-meta">
													Carry-in:{" "}
													{result.carry_in
														? "✅"
														: "❌"}{" "}
													• Cost: $
													{result.total_cost?.toFixed(
														4
													)}{" "}
													• Time:{" "}
													{result.execution_time}ms
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</main>

			<footer className="footer">
				<p>Built for Sentari Interview Challenge • Team Group 1</p>
			</footer>
		</div>
	);
}

export default App;
