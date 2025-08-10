import React, { useState } from "react";
import TopBar from "./components/ContactsTopBar";
import ContactsTable from "./components/ContactsTable";
import ContactFormModal from "./components/ContactFormModal";
import BulkActionsBar from "./components/BulkActionsBar";

function Contacts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // ✅ Added here
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const handleAddNew = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleEdit = contact => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleSaveComplete = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    setCurrentPage(1); // ✅ Reset to page 1 on save
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectionChange = ids => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="p-4 space-y-4">
      <TopBar
        onAddClick={handleAddNew}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchChange={setSearchTerm}
      />

      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      <ContactsTable
        onEdit={handleEdit}
        activeTab={activeTab}
        refreshTrigger={refreshTrigger}
        searchTerm={searchTerm}
        onSelectionChange={handleSelectionChange}
        selectedIds={selectedIds}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage} // ✅ Pass down
      />

      <ContactFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contact={selectedContact}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
}

export default Contacts;
