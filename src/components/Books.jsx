import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import "./Books.css"; // Ensure you have the CSS file created previously

const baseURL = "http://localhost:3000/api";

// --- REUSABLE COMPONENT FOR ADDING METADATA (Author/Tag/Category) ---
const MetadataForm = ({ title, placeholder, onSubmit }) => {
    const [value, setValue] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        setValue(""); // Clear input after submit
    };

    return (
        <div className="card mini-form">
            <h4>{title}</h4>
            <form onSubmit={handleSubmit} className="inline-form">
                <input 
                    type="text" 
                    placeholder={placeholder} 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button type="submit" title="Add new">+</button>
            </form>
        </div>
    );
};

const Books = () => {
    // --- STATE MANAGEMENT ---
    const [books, setBooks] = useState([]);
    const [role, setRole] = useState(Cookies.get("user_role") || "");
    
    // Centralized options state for dropdowns
    const [options, setOptions] = useState({ 
        authors: [], 
        categories: [], 
        tags: [] 
    });

    // Form Selection State (Controlled Components)
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    // --- FETCH DATA (Parallel) ---
    const fetchAllData = async () => {
        try {
            const token = Cookies.get("auth_token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch everything at once for performance
            const [booksRes, authorsRes, catsRes, tagsRes] = await Promise.all([
                axios.get(`${baseURL}/book`, config),
                axios.get(`${baseURL}/author`, config),
                axios.get(`${baseURL}/category`, config),
                axios.get(`${baseURL}/tag`, config)
            ]);

            setBooks(booksRes.data.books || []);
            
            // Map data to React-Select format { label, value }
            setOptions({
                authors: authorsRes.data.authors.map(a => ({ label: a.name, value: a._id })),
                categories: catsRes.data.categories.map(c => ({ label: c.name, value: c._id })),
                tags: tagsRes.data.tags.map(t => ({ label: t.name, value: t._id }))
            });

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // --- HELPER: GENERIC ADD FUNCTION ---
    const addItem = async (endpoint, name, listKey, responseKey) => {
        try {
            const token = Cookies.get("auth_token");
            const response = await axios.post(
                `${baseURL}/${endpoint}`, 
                { name }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Attempt to find the new item in the response
            let newItemRaw = response.data[responseKey];
            
            // Fallback: If backend returns object directly or uses different key
            if (!newItemRaw && response.data.name) newItemRaw = response.data;

            // Safety check
            if (!newItemRaw) {
                console.error(`ERROR: Response missing key '${responseKey}'`, response.data);
                alert("Item added, but could not update list automatically. Please refresh.");
                return;
            }

            // Format and Update State
            const newItemFormatted = { label: newItemRaw.name, value: newItemRaw._id };

            setOptions(prev => ({
                ...prev,
                [listKey]: [...prev[listKey], newItemFormatted]
            }));

        } catch (error) {
            console.error(`Failed to add ${endpoint}:`, error);
            alert(`Error adding ${endpoint}`);
        }
    };

    // --- SPECIFIC HANDLERS ---
    // Adjust 'responseKey' (4th arg) if your backend returns { savedCategory: ... } instead of { category: ... }
    const handleAddAuthor = (name) => addItem('author', name, 'authors', 'author');
    const handleAddCategory = (name) => addItem('category', name, 'categories', 'category');
    const handleAddTag = (name) => addItem('tag', name, 'tags', 'tag');

    // --- UPLOAD BOOK HANDLER ---
    const handleBookUpload = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get("auth_token");
            const formData = new FormData();
            
            // 1. Basic Fields
            formData.append('file', e.target.file.files[0]); 
            formData.append('title', e.target.title.value);
            formData.append('description', e.target.description.value);

            // 2. Arrays (Append multiple times for Multer to read as array)
            // Note: These keys (authorIds) must match req.body destructuring in backend
            selectedAuthors.forEach(a => formData.append('authorIds', a.value));
            selectedCategories.forEach(c => formData.append('categoriesIds', c.value));
            selectedTags.forEach(t => formData.append('tagsIds', t.value));

            // 3. Send Request
            await axios.post(`${baseURL}/book/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Book uploaded successfully!");
            
            // 4. Reset Form
            e.target.reset();
            setSelectedAuthors([]);
            setSelectedCategories([]);
            setSelectedTags([]);
            
            // 5. Refresh List
            fetchAllData(); 

        } catch (error) {
            console.error("Book upload failed:", error.response?.data || error);
            alert("Error uploading book: " + (error.response?.data?.message || error.message));
        }
    };

    // --- READ BOOK HANDLER (BLOB + NEW TAB) ---
    const handleRead = async (bookId) => {
        try {
            const token = Cookies.get("auth_token");
            
            // Open tab early to prevent popup blockers
            const pdfWindow = window.open("", "_blank");
            if(pdfWindow) pdfWindow.document.write("Loading book secure viewer...");

            // Fetch PDF as Blob
            const response = await axios.get(`${baseURL}/book/${bookId}/file`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob' 
            });

            // Create Virtual URL
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);

            // Redirect tab to Blob URL
            if(pdfWindow) pdfWindow.location.href = fileURL;

        } catch (error) {
            console.error("Error reading book:", error);
            alert("Failed to load book. Make sure you are logged in.");
        }
    };

    return (
        <div className="page-container">
            
            {/* LEFT COLUMN: BOOK LIST */}
            <main className="main-content">
                <header className="page-header">
                    <h1>Library Books</h1>
                    <span className="badge">{books.length} items</span>
                </header>

                <div className="book-grid">
                    {books.length > 0 ? (
                        books.map((book) => (
                            <div key={book._id} className="book-card">
                                <div className="book-info">
                                    <h3>{book.title}</h3>
                                    <p className="book-meta">
                                        {/* Join author names safely */}
                                        {book.authors && book.authors.length > 0 
                                            ? book.authors.map(a => a.name).join(", ") 
                                            : "Unknown Author"}
                                    </p>
                                </div>
                                <button 
                                    className="btn-primary" 
                                    onClick={() => handleRead(book._id)}
                                >
                                    Read
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="empty-state">No books available.</p>
                    )}
                </div>
            </main>

            {/* RIGHT COLUMN: SIDEBAR ACTIONS */}
            {role === 'admin' && <aside className="sidebar">
                
                {/* 1. UPLOAD FORM */}
                <div className="card upload-card">
                    <h2>Upload New Book</h2>
                    <form className="stack-form" onSubmit={handleBookUpload}>
                        <div className="form-group">
                            <label>Book File (PDF)</label>
                            <input type="file" name="file" required accept="application/pdf" />
                        </div>
                        <div className="form-group">
                            <input type="text" name="title" placeholder="Book Title" required />
                        </div>
                        <div className="form-group">
                            <input type="text" name="description" placeholder="Description" required />
                        </div>

                        <div className="form-group">
                            <label>Authors</label>
                            <Select 
                                isMulti 
                                options={options.authors} 
                                value={selectedAuthors} 
                                onChange={setSelectedAuthors} 
                                placeholder="Select authors..."
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Categories</label>
                            <Select 
                                isMulti 
                                options={options.categories} 
                                value={selectedCategories} 
                                onChange={setSelectedCategories} 
                                placeholder="Select categories..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Tags</label>
                            <Select 
                                isMulti 
                                options={options.tags} 
                                value={selectedTags} 
                                onChange={setSelectedTags} 
                                placeholder="Select tags..."
                            />
                        </div>
                        
                        <button type="submit" className="btn-submit">Upload Book</button>
                    </form>
                </div>

                {/* 2. QUICK ADD TOOLS */}
                <div className="tools-section">
                    <h3>Quick Add Metadata</h3>
                    <MetadataForm 
                        title="New Author" 
                        placeholder="Author Name" 
                        onSubmit={handleAddAuthor} 
                    />
                    <MetadataForm 
                        title="New Category" 
                        placeholder="Category Name" 
                        onSubmit={handleAddCategory} 
                    />
                    <MetadataForm 
                        title="New Tag" 
                        placeholder="Tag Name" 
                        onSubmit={handleAddTag} 
                    />
                </div>
            </aside>}
        </div>
    );
};

export default Books;