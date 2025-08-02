# 🚀 Easy cPanel Deployment Guide

## 📦 **What You Need to Upload**

Upload these files to your cPanel at `public_html/roster/`:

### **1. Frontend Files (from `dist/spa/`):**
- `index.html`
- `assets/` folder (contains CSS and JS files)

### **2. Backend Files:**
- `api/config.php` (database configuration)
- `api/crew.php` (API endpoints)
- `.htaccess` (URL routing)

### **3. Database Setup:**
- Run the SQL script to create your database table

---

## 🔧 **Step-by-Step Deployment**

### **Step 1: Database Setup**
1. In cPanel, go to **MySQL Databases**
2. Create a new database: `[your-prefix]_roster`
3. Create a database user and assign to the database
4. Note down: database name, username, and password
5. Go to **phpMyAdmin** and run this SQL:

```sql
CREATE TABLE crew_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status ENUM('in', 'out') DEFAULT 'in',
    note TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO crew_members (name, status, note) VALUES 
('John Smith', 'in', NULL),
('Sarah Johnson', 'out', 'Lunch'),
('Mike Davis', 'in', NULL);
```

### **Step 2: Upload Files**
1. In cPanel **File Manager**, navigate to `public_html/`
2. Create a folder called `roster`
3. Upload all files maintaining this structure:

```
public_html/roster/
├── index.html
├── assets/
│   ├── index-BFRC8Rmb.css
│   └── index-FnOphf8p.js
├── .htaccess
└── api/
    ├── config.php
    └── crew.php
```

### **Step 3: Configure Database**
1. Edit `api/config.php` with your database details:
   - Replace `your_database_name` with your actual database name
   - Replace `your_username` with your database username
   - Replace `your_password` with your database password

### **Step 4: Test Your App**
Visit: `https://nerkco.com/roster`

---

## ✅ **Quick Checklist**

- [ ] Database created and SQL script run
- [ ] All files uploaded to `roster/` folder
- [ ] Database credentials updated in `config.php`
- [ ] App loads at `nerkco.com/roster`
- [ ] Can log in as Flight Lead
- [ ] Can add/remove crew members
- [ ] Status changes are saved

---

## 🆘 **Troubleshooting**

**If the app shows "Failed to fetch":**
- Check database credentials in `config.php`
- Ensure database table exists
- Check file permissions (644 for files, 755 for folders)

**If routing doesn't work:**
- Ensure `.htaccess` file is uploaded
- Check if mod_rewrite is enabled in cPanel

**Database connection errors:**
- Verify database name, username, and password
- Ensure database user has full permissions on the database

---

## 📱 **How to Use Your App**

1. **Flight Lead Access**: Full dashboard with all crew management
2. **Individual Access**: Select your name to control only your status
3. **Status Changes**: Toggle switch (green = in, red = out)
4. **Going Out**: Requires a note about where you're going
5. **Coming Back**: Simply toggle to "in" - note disappears automatically

Your crew status app is now live at **nerkco.com/roster**! 🎯
