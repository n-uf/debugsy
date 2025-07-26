# Debugsy Documentation & Agent Files

## 📁 **Folder Contents**

This `_agent/` folder contains comprehensive documentation, guides, and development utilities for the Debugsy package.

### **📚 User Documentation**

- **[user-manual.md](./user-manual.md)** - Complete user manual with installation, setup, API reference, and troubleshooting
- **[quick-reference.md](./quick-reference.md)** - Quick reference guide for developers with common commands and patterns

### **🔧 Technical Documentation**

- **[dependency-tracking-fix.md](./dependency-tracking-fix.md)** - Details on the useWhyDidYouUpdate fix and implementation
- **[debug-deps-test.ts](./debug-deps-test.ts)** - Test utilities for verifying dependency tracking functionality

### **📋 Development Notes**

- **[README.md](./README.md)** - This file - overview of documentation structure

---

## 📖 **Documentation Structure**

### **For End Users**

1. **Start here**: [user-manual.md](./user-manual.md) - Comprehensive guide
2. **Quick reference**: [quick-reference.md](./quick-reference.md) - Fast lookup

### **For Developers/Maintainers**

1. **Technical fixes**: [dependency-tracking-fix.md](./dependency-tracking-fix.md)
2. **Testing tools**: [debug-deps-test.ts](./debug-deps-test.ts)

---

## 🏗️ **Package Structure Improvements**

The debugsy package now includes enhanced folder structure with proper index.ts files:

```
packages/debugsy/
├── index.ts                          # Main package exports
├── src/
│   ├── components/
│   │   ├── index.ts                  # Component exports
│   │   └── logs/
│   │       ├── index.ts              # Log component exports
│   │       ├── formatters/
│   │       │   └── index.ts          # Formatter exports
│   │       └── utils/
│   │           └── index.ts          # Utility exports
│   ├── debug-deps/
│   │   ├── index.ts                  # Dependency tracking exports
│   │   └── _agent/
│   │       ├── debug-deps-test.ts    # Testing utilities
│   │       └── dependency-tracking-fix.md
│   └── hooks/
│       └── index.ts                  # Hook exports
└── _agent/                           # Documentation & guides
    ├── README.md                     # This file
    ├── user-manual.md                # Complete user guide
    ├── quick-reference.md            # Quick reference
    └── dependency-tracking-fix.md    # Technical documentation
```

### **Benefits of Enhanced Structure**

✅ **Cleaner Imports**: Use package-level exports instead of deep imports  
✅ **Better Organization**: Related functionality grouped together  
✅ **Comprehensive Documentation**: Complete user guides and technical docs  
✅ **Developer Utilities**: Testing and verification tools included  
✅ **Easier Maintenance**: Clear separation of concerns and responsibilities

---

## 🚀 **Quick Start for New Users**

1. **Read the user manual**: [user-manual.md](./user-manual.md)
2. **Try the quick reference**: [quick-reference.md](./quick-reference.md)
3. **Test the setup**: Run `testDependencyTracking()` in browser console
4. **Get help**: Check troubleshooting section in user manual

---

## 🔧 **For Package Maintainers**

### **Adding New Features**

1. **Update relevant index.ts** files to export new functionality
2. **Add documentation** to user manual for user-facing features
3. **Update quick reference** with new console commands or common patterns
4. **Create technical docs** in `_agent/` for complex implementations

### **Testing Changes**

1. **Use debug-deps-test.ts** utilities for dependency tracking features
2. **Verify exports** work correctly through index.ts files
3. **Test documentation** examples to ensure they work
4. **Update version** information in user manual if needed

---

## 📞 **Getting Help**

- **For users**: Check [user-manual.md](./user-manual.md) troubleshooting section
- **For developers**: Review technical documentation in this folder
- **For quick answers**: Use [quick-reference.md](./quick-reference.md)

**Happy debugging! 🐛➡️✨**
