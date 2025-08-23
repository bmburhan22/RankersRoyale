// Shared styles for consistent UI across different pages
export const sharedStyles = {
  // Button styles
  button: {
    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    color: 'white',
    borderRadius: '8px',
    px: 3,
    py: 1.5,
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #0056b3 0%, #007bff 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 16px rgba(0, 123, 255, 0.4)',
    },
    '&:disabled': {
      background: 'rgba(128, 128, 128, 0.5)',
      color: 'rgba(255, 255, 255, 0.7)',
      boxShadow: 'none',
      transform: 'none',
    }
  },

  // Primary button variant
  primaryButton: {
    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
    color: 'white',
    borderRadius: '8px',
    px: 3,
    py: 1.5,
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #0056b3 0%, #007bff 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 16px rgba(0, 123, 255, 0.4)',
    }
  },

  // Success button variant
  successButton: {
    background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
    color: 'white',
    borderRadius: '8px',
    px: 3,
    py: 1.5,
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #1e7e34 0%, #28a745 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 16px rgba(40, 167, 69, 0.4)',
    }
  },

  // Danger button variant
  dangerButton: {
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    color: 'white',
    borderRadius: '8px',
    px: 3,
    py: 1.5,
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #c82333 0%, #dc3545 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 16px rgba(220, 53, 69, 0.4)',
    }
  },

  // Warning button variant
  warningButton: {
    background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
    color: 'white',
    borderRadius: '8px',
    px: 3,
    py: 1.5,
    fontWeight: '600',
    textTransform: 'none',
    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'linear-gradient(135deg, #e0a800 0%, #ffc107 100%)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 16px rgba(255, 193, 7, 0.4)',
    }
  },

  // Input field styles
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: '1px solid rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        border: '2px solid #007bff',
      },
      '& input': {
        color: 'white',
        '&::placeholder': {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.8)',
      '&.Mui-focused': {
        color: '#007bff',
      },
    },
  },

  // Select/Dropdown styles
  select: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'white',
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: '1px solid rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        border: '2px solid #007bff',
      },
    },
    '& .MuiSelect-icon': {
      color: 'white',
    },
    '& .MuiSelect-select': {
      color: 'white',
      '&:focus': {
        backgroundColor: 'transparent',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.8)',
      '&.Mui-focused': {
        color: '#007bff',
      },
    },
  },

  // Card styles
  card: {
    background: 'rgba(15, 20, 25, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: 3,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  // Table styles
  table: {
    '& .MuiDataGrid-root': {
      backgroundColor: 'transparent',
      color: 'white',
      border: 'none',
      '& .MuiDataGrid-cell': {
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
      },
             '& .MuiDataGrid-columnHeader': {
         color: 'white',
         backgroundColor: 'rgba(15, 20, 25, 0.8)',
         borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
         fontWeight: '600',
         fontSize: '14px',
         padding: '12px 16px',
         minHeight: '56px',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         transition: 'all 0.2s ease',
         cursor: 'pointer',
         '&:hover': {
           backgroundColor: 'rgba(0, 123, 255, 0.15)',
           transform: 'translateY(-1px)',
           boxShadow: '0 2px 8px rgba(0, 123, 255, 0.2)',
         },
         '&:active': {
           transform: 'translateY(0)',
           boxShadow: '0 1px 4px rgba(0, 123, 255, 0.3)',
         },
         '&.MuiDataGrid-columnHeader--sortable': {
           '&:hover': {
             backgroundColor: 'rgba(0, 123, 255, 0.2)',
           },
         },
         '&.MuiDataGrid-columnHeader--sorted': {
           backgroundColor: 'rgba(0, 123, 255, 0.1)',
           '&:hover': {
             backgroundColor: 'rgba(0, 123, 255, 0.25)',
           },
         },
       },
       '& .MuiDataGrid-filler': {
         backgroundColor: 'rgba(15, 20, 25, 0.8)',
         borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
       },
      '& .MuiDataGrid-row': {
        '&:hover': {
          backgroundColor: 'rgba(0, 123, 255, 0.05)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
        },
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        '& .MuiTablePagination-root': {
          color: 'white',
        },
        '& .MuiTablePagination-selectIcon': {
          color: 'white',
        },
      },
    },
  },

  // Page container styles
  pageContainer: {
    background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%)',
    minHeight: '100vh',
    color: 'white',
    padding: 3,
  },

  // Section header styles
  sectionHeader: {
    marginBottom: 4,
    padding: 3,
    background: 'rgba(0, 123, 255, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 123, 255, 0.2)',
  },

  // Form section styles
  formSection: {
    marginBottom: 4,
    padding: 3,
    background: 'rgba(15, 20, 25, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Status chip styles
  statusChip: {
    borderRadius: '16px',
    fontWeight: '600',
    textTransform: 'none',
  },

  // Success status
  successStatus: {
    backgroundColor: 'rgba(40, 167, 69, 0.3)',
    color: '#28a745',
    border: '1px solid rgba(40, 167, 69, 0.5)',
    fontWeight: '600',
  },

  // Warning status
  warningStatus: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    color: '#ffc107',
    border: '1px solid rgba(255, 193, 7, 0.5)',
    fontWeight: '600',
  },

  // Danger status
  dangerStatus: {
    backgroundColor: 'rgba(220, 53, 69, 0.3)',
    color: '#dc3545',
    border: '1px solid rgba(220, 53, 69, 0.5)',
    fontWeight: '600',
  },

  // Info status
  infoStatus: {
    backgroundColor: 'rgba(0, 123, 255, 0.3)',
    color: '#007bff',
    border: '1px solid rgba(0, 123, 255, 0.5)',
    fontWeight: '600',
  },

  // Pending status
  pendingStatus: {
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    color: '#ffc107',
    border: '1px solid rgba(255, 193, 7, 0.5)',
    fontWeight: '600',
  },

  // Approved status
  approvedStatus: {
    backgroundColor: 'rgba(40, 167, 69, 0.3)',
    color: '#28a745',
    border: '1px solid rgba(40, 167, 69, 0.5)',
    fontWeight: '600',
  },

     // Rejected status
   rejectedStatus: {
     backgroundColor: 'rgba(220, 53, 69, 0.3)',
     color: '#dc3545',
     border: '1px solid rgba(220, 53, 69, 0.5)',
     fontWeight: '600',
   },

   // Action button styles for DataGrid
   actionButton: {
     minWidth: '32px',
     height: '32px',
     borderRadius: '6px',
     transition: 'all 0.2s ease',
     '&:hover': {
       transform: 'scale(1.1)',
     },
   },

   // Delete button style
   deleteButton: {
     backgroundColor: 'rgba(220, 53, 69, 0.2)',
     color: 'white',
     border: '1px solid rgba(220, 53, 69, 0.5)',
     '&:hover': {
       backgroundColor: 'rgba(220, 53, 69, 0.4)',
       borderColor: 'rgba(220, 53, 69, 0.7)',
       boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
     },
   },

   // Approve button style
   approveButton: {
     backgroundColor: 'rgba(40, 167, 69, 0.2)',
     color: 'white',
     border: '1px solid rgba(40, 167, 69, 0.5)',
     '&:hover': {
       backgroundColor: 'rgba(40, 167, 69, 0.4)',
       borderColor: 'rgba(40, 167, 69, 0.7)',
       boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
     },
   },

   // Decline button style
   declineButton: {
     backgroundColor: 'rgba(220, 53, 69, 0.2)',
     color: 'white',
     border: '1px solid rgba(220, 53, 69, 0.5)',
     '&:hover': {
       backgroundColor: 'rgba(220, 53, 69, 0.4)',
       borderColor: 'rgba(220, 53, 69, 0.7)',
       boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)',
     },
   },
};

// Helper function to get button style by variant
export const getButtonStyle = (variant = 'primary') => {
  const variants = {
    primary: sharedStyles.primaryButton,
    success: sharedStyles.successButton,
    danger: sharedStyles.dangerButton,
    warning: sharedStyles.warningButton,
  };
  return variants[variant] || sharedStyles.primaryButton;
};

// Helper function to get status chip style by status
export const getStatusStyle = (status) => {
  const statusMap = {
    // General statuses
    success: sharedStyles.successStatus,
    warning: sharedStyles.warningStatus,
    danger: sharedStyles.dangerStatus,
    info: sharedStyles.infoStatus,

    // Withdrawal specific statuses
    pending: sharedStyles.pendingStatus,
    approved: sharedStyles.approvedStatus,
    rejected: sharedStyles.rejectedStatus,

    // Common variations
    active: sharedStyles.successStatus,
    inactive: sharedStyles.dangerStatus,
    processing: sharedStyles.warningStatus,
    completed: sharedStyles.successStatus,
    failed: sharedStyles.dangerStatus,
  };

  // Convert to lowercase for case-insensitive matching
  const normalizedStatus = status?.toLowerCase();
  return statusMap[normalizedStatus] || sharedStyles.infoStatus;
};

// Helper function to get action button style by type
export const getActionButtonStyle = (type = 'default') => {
  const actionMap = {
    delete: { ...sharedStyles.actionButton, ...sharedStyles.deleteButton },
    approve: { ...sharedStyles.actionButton, ...sharedStyles.approveButton },
    decline: { ...sharedStyles.actionButton, ...sharedStyles.declineButton },
    default: sharedStyles.actionButton,
  };
  return actionMap[type] || actionMap.default;
};
