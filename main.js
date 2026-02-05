// Show create product modal (categoryId is input)
function showCreateProductModal() {
    document.getElementById('create-title').value = '';
    document.getElementById('create-price').value = '';
    document.getElementById('create-category-id').value = '';
    document.getElementById('create-description').value = '';
    document.getElementById('create-image').value = '';
    document.getElementById('create-image-preview').src = '';
    const modal = new window.bootstrap.Modal(document.getElementById('createProductModal'));
    modal.show();
}

// Handle image preview in create modal
function handleCreateImageInput() {
	const url = document.getElementById('create-image').value;
	document.getElementById('create-image-preview').src = url;
}

// Handle create product save
// Handle create product save
async function handleCreateSave() {
    const title = document.getElementById('create-title').value.trim();
    const price = parseFloat(document.getElementById('create-price').value);
    const categoryId = parseInt(document.getElementById('create-category-id').value, 10);
    const description = document.getElementById('create-description').value.trim();
    const image = document.getElementById('create-image').value.trim();

    // Validate client
    if (!title || isNaN(price) || isNaN(categoryId) || !image) {
        alert('Vui lòng nhập đầy đủ Title, Price, Category ID và Image URL!');
        return;
    }

    try {
        const res = await fetch('https://api.escuelajs.co/api/v1/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                price,
                description,
                categoryId,
                images: [image]
            })
        });

        // Xử lý lỗi từ Server (Quan trọng)
        if (!res.ok) {
            // API này trả về lỗi dạng JSON, ta cần đọc nó ra
            const errorData = await res.json();
            console.error("Chi tiết lỗi:", errorData);

            let message = "Tạo thất bại!";
            // API thường trả về mảng lỗi trong thuộc tính 'message'
            if (errorData.message) {
                if (Array.isArray(errorData.message)) {
                    message += "\n- " + errorData.message.join("\n- ");
                } else {
                    message += "\n" + errorData.message;
                }
            } else if (errorData.error) {
                message += "\n" + errorData.error;
            }
            
            alert(message);
            return;
        }

		const created = await res.json();
		// Xóa các sản phẩm trùng id vừa tạo (nếu có)
		allProducts = allProducts.filter(p => p.id !== created.id);
		filteredProducts = filteredProducts.filter(p => p.id !== created.id);
		allProducts.unshift(created);
		filteredProducts.unshift(created);
		renderProducts();

		// Hide modal
		const modalEl = document.getElementById('createProductModal');
		const modal = window.bootstrap.Modal.getInstance(modalEl);
		if (modal) modal.hide();

		// Reset form để nhập tiếp
		document.getElementById('create-product-form').reset();
		document.getElementById('create-image-preview').src = '';
		document.getElementById('create-image-preview').style.display = 'none';

		alert('Product created successfully!');
    } catch (err) {
        console.error(err);
        alert('Lỗi hệ thống hoặc lỗi mạng!');
    }
}


let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let perPage = 10;
let sortState = {
	title: null, // 'asc' | 'desc' | null
	price: null  // 'asc' | 'desc' | null
};


// Sort filteredProducts by key and order
function sortProducts(key) {
	// Toggle sort order
	if (sortState[key] === 'asc') {
		sortState[key] = 'desc';
	} else {
		sortState[key] = 'asc';
	}
	// Reset other sort
	if (key === 'title') sortState.price = null;
	if (key === 'price') sortState.title = null;

	filteredProducts.sort((a, b) => {
		let valA = a[key];
		let valB = b[key];
		if (key === 'title') {
			valA = valA ? valA.toLowerCase() : '';
			valB = valB ? valB.toLowerCase() : '';
		}
		if (valA < valB) return sortState[key] === 'asc' ? -1 : 1;
		if (valA > valB) return sortState[key] === 'asc' ? 1 : -1;
		return 0;
	});
	currentPage = 1;
	renderProducts();
}

// Render products to table with pagination
function renderProducts() {
	const tableBody = document.querySelector('#products-table tbody');
	tableBody.innerHTML = '';
	if (!filteredProducts.length) {
		tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
		renderPagination(1, 1);
		return;
	}
	const startIdx = (currentPage - 1) * perPage;
	const endIdx = startIdx + perPage;
	const pageProducts = filteredProducts.slice(startIdx, endIdx);
	pageProducts.forEach(product => {
		const row = document.createElement('tr');
		// Đảm bảo images là mảng và lấy đúng URL đầu tiên
		let imgUrl = '';
		if (Array.isArray(product.images) && product.images.length > 0) {
			imgUrl = product.images[0];
		} else if (typeof product.images === 'string') {
			imgUrl = product.images;
		}
		row.innerHTML = `
			<td>${product.id}</td>
			<td>${product.title}</td>
			<td>$${product.price}</td>
			<td>${product.category?.name || ''}</td>
			<td>
				${imgUrl ? `<img src="${imgUrl}" alt="Image" style="width:60px;height:60px;object-fit:cover;">` : ''}
			</td>
		`;
		// Add tooltip for description
		row.setAttribute('data-bs-toggle', 'tooltip');
		row.setAttribute('data-bs-placement', 'top');
		row.setAttribute('title', product.description ? product.description.replace(/"/g, '&quot;') : '');
		// Add click event to show modal
		row.style.cursor = 'pointer';
		row.addEventListener('click', function(e) {
			// Prevent tooltip click
			if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
			showProductModal(product);
		});
		tableBody.appendChild(row);
	});
	// Initialize Bootstrap tooltips
	if (window.bootstrap) {
		const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
		tooltipTriggerList.forEach(function (tooltipTriggerEl) {
			new window.bootstrap.Tooltip(tooltipTriggerEl);
		});
	}
	// Render pagination
	const totalPages = Math.ceil(filteredProducts.length / perPage) || 1;
	renderPagination(currentPage, totalPages);

	// Update sort icons
	const sortTitleIcon = document.getElementById('sort-title-icon');
	const sortPriceIcon = document.getElementById('sort-price-icon');
	if (sortTitleIcon) {
		if (sortState.title === 'asc') sortTitleIcon.className = 'bi bi-arrow-up';
		else if (sortState.title === 'desc') sortTitleIcon.className = 'bi bi-arrow-down';
		else sortTitleIcon.className = 'bi bi-arrow-down-up';
	}
	if (sortPriceIcon) {
		if (sortState.price === 'asc') sortPriceIcon.className = 'bi bi-arrow-up';
		else if (sortState.price === 'desc') sortPriceIcon.className = 'bi bi-arrow-down';
		else sortPriceIcon.className = 'bi bi-arrow-down-up';
	}
}

// Show product detail modal
function showProductModal(product) {
	document.getElementById('modal-product-id').value = product.id;
	document.getElementById('modal-title').value = product.title || '';
	document.getElementById('modal-price').value = product.price || '';
	document.getElementById('modal-category').value = product.category?.name || '';
	document.getElementById('modal-description').value = product.description || '';
	document.getElementById('modal-image').value = product.images && product.images.length > 0 ? product.images[0] : '';
	document.getElementById('modal-image-preview').src = product.images && product.images.length > 0 ? product.images[0] : '';
	// Show modal
	const modal = new window.bootstrap.Modal(document.getElementById('productModal'));
	modal.show();
}

// Handle image preview in modal
function handleModalImageInput() {
	const url = document.getElementById('modal-image').value;
	document.getElementById('modal-image-preview').src = url;
}

// Handle edit & save
async function handleModalEditSave() {
	const id = document.getElementById('modal-product-id').value;
	const title = document.getElementById('modal-title').value.trim();
	const price = parseFloat(document.getElementById('modal-price').value);
	const description = document.getElementById('modal-description').value.trim();
	const image = document.getElementById('modal-image').value.trim();
	if (!title || isNaN(price)) {
		alert('Title and price are required!');
		return;
	}
	// Update API
	try {
		const res = await fetch(`https://api.escuelajs.co/api/v1/products/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title,
				price,
				description,
				images: image ? [image] : []
			})
		});
		if (!res.ok) throw new Error('Update failed');
		// Update local data
		const updated = await res.json();
		// Update allProducts and filteredProducts
		[allProducts, filteredProducts].forEach(arr => {
			const idx = arr.findIndex(p => p.id == id);
			if (idx !== -1) {
				arr[idx] = { ...arr[idx], ...updated };
			}
		});
		renderProducts();
		// Hide modal
		const modalEl = document.getElementById('productModal');
		const modal = window.bootstrap.Modal.getInstance(modalEl);
		if (modal) modal.hide();
		alert('Product updated successfully!');
	} catch (err) {
		alert('Update failed!');
	}
}

// Render pagination controls
function renderPagination(current, total) {
	const pagination = document.getElementById('pagination');
	if (!pagination) return;
	pagination.innerHTML = '';
	// Previous button
	const prevLi = document.createElement('li');
	prevLi.className = 'page-item' + (current === 1 ? ' disabled' : '');
	prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1">&laquo;</a>`;
	prevLi.onclick = (e) => { e.preventDefault(); if (current > 1) { currentPage--; renderProducts(); } };
	pagination.appendChild(prevLi);
	// Page numbers (show max 5 pages)
	let start = Math.max(1, current - 2);
	let end = Math.min(total, start + 4);
	if (end - start < 4) start = Math.max(1, end - 4);
	for (let i = start; i <= end; i++) {
		const li = document.createElement('li');
		li.className = 'page-item' + (i === current ? ' active' : '');
		li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
		li.onclick = (e) => { e.preventDefault(); currentPage = i; renderProducts(); };
		pagination.appendChild(li);
	}
	// Next button
	const nextLi = document.createElement('li');
	nextLi.className = 'page-item' + (current === total ? ' disabled' : '');
	nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
	nextLi.onclick = (e) => { e.preventDefault(); if (current < total) { currentPage++; renderProducts(); } };
	pagination.appendChild(nextLi);
}


// Fetch products and store in allProducts
async function loadProducts() {
	const tableBody = document.querySelector('#products-table tbody');
	tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
	try {
		const res = await fetch('https://api.escuelajs.co/api/v1/products');
		allProducts = await res.json();
		filteredProducts = allProducts;
		currentPage = 1;
		renderProducts();
	} catch (error) {
		tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error loading products</td></tr>`;
	}
}


// Search handler
function handleSearch() {
	const searchValue = document.getElementById('search-title').value.trim().toLowerCase();
	filteredProducts = allProducts.filter(product => product.title.toLowerCase().includes(searchValue));
	currentPage = 1;
	renderProducts();
}

// Per page handler
function handlePerPageChange() {
	const perPageSelect = document.getElementById('per-page');
	perPage = parseInt(perPageSelect.value, 10);
	currentPage = 1;
	renderProducts();
}

// Export current view to CSV
function exportCurrentViewToCSV() {
	// Get current page data
	const startIdx = (currentPage - 1) * perPage;
	const endIdx = startIdx + perPage;
	const pageProducts = filteredProducts.slice(startIdx, endIdx);
	if (!pageProducts.length) return;
	// Prepare CSV header
	const header = ['ID', 'Title', 'Price', 'Category', 'Description', 'Image'];
	const rows = [header];
	// Prepare data rows
	pageProducts.forEach(product => {
		rows.push([
			product.id,
			'"' + (product.title ? product.title.replace(/"/g, '""') : '') + '"',
			product.price,
			'"' + (product.category?.name ? product.category.name.replace(/"/g, '""') : '') + '"',
			'"' + (product.description ? product.description.replace(/"/g, '""') : '') + '"',
			product.images && product.images.length > 0 ? product.images[0] : ''
		]);
	});
	// Convert to CSV string
	const csvContent = rows.map(r => r.join(',')).join('\r\n');
	// Download
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'products_page_' + currentPage + '.csv';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

window.addEventListener('DOMContentLoaded', () => {
	loadProducts();
	const searchInput = document.getElementById('search-title');
	if (searchInput) {
		searchInput.addEventListener('input', handleSearch);
	}
	const perPageSelect = document.getElementById('per-page');
	if (perPageSelect) {
		perPageSelect.addEventListener('change', handlePerPageChange);
	}
	// Sort buttons
	const sortTitleBtn = document.getElementById('sort-title');
	if (sortTitleBtn) {
		sortTitleBtn.addEventListener('click', function(e) {
			e.preventDefault();
			sortProducts('title');
		});
	}
	const sortPriceBtn = document.getElementById('sort-price');
	if (sortPriceBtn) {
		sortPriceBtn.addEventListener('click', function(e) {
			e.preventDefault();
			sortProducts('price');
		});
	}
	// Export CSV button
	const exportBtn = document.getElementById('export-csv');
	if (exportBtn) {
		exportBtn.addEventListener('click', exportCurrentViewToCSV);
	}
	// Modal image preview
	const modalImageInput = document.getElementById('modal-image');
	if (modalImageInput) {
		modalImageInput.addEventListener('input', handleModalImageInput);
	}
	// Modal edit button
	const modalEditBtn = document.getElementById('modal-edit-btn');
	if (modalEditBtn) {
		modalEditBtn.addEventListener('click', handleModalEditSave);
	}
	// Create product modal
	const createBtn = document.getElementById('create-product-btn');
	if (createBtn) {
		createBtn.addEventListener('click', showCreateProductModal);
	}
	const createImageInput = document.getElementById('create-image');
	if (createImageInput) {
		createImageInput.addEventListener('input', handleCreateImageInput);
	}
	const createSaveBtn = document.getElementById('create-save-btn');
	if (createSaveBtn) {
		createSaveBtn.addEventListener('click', handleCreateSave);
	}
});
