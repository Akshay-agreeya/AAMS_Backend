const passwordValidation = { 
  required: true, 
  type: "string", 
  minLength: 8, 
  pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*])/ 
};

const userLoginAndFPSchema = {
    email: {
      required: true,
      type: "string",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { 
        required: true, 
        type: "string", 
        minLength: 8,
        pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*])/}
  };

const changePasswordSchema = {
    oldPassword: { ...passwordValidation },
    newPassword: { ...passwordValidation }
  }

  const orgSchema = {
    org_name: { required: true, type: "string" },
    org_type_id: { required: true, type: "number" },
    industry_id: { required: true, type: "number" },
    address_line: { required: true, type: "string" },
    city: { required: false, type: "string" },
    state: { required: false, type: "string" },
    zip_code: { required: true, type: "string" },
    country: { required: true, type: "string" },
    first_name: { required: true, type: "string" },
    last_name: { required: true, type: "string" },
    email: {
        required: true,
        type: "string",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone_number: {
        required: true,
        type: "string",
        pattern: /^[0-9]{10}$/,
    },
    contract_expiry_date: { 
        required: true, 
        type: "string", 
        pattern: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/ 
    },
};

const userSchema = {
  username: { required: true, type: "string" },
  first_name: { required: true, type: "string" },
  last_name: { required: true, type: "string" }, 
  email: {
    required: true,
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
},
  phone_number: {
    required: true,
    type: "string",
    pattern: /^[0-9]{10}$/,
}, 
  password: { 
    required: true, 
    type: "string", 
    minLength: 8,
    pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z])(?=.*[!@#$%^&*])/},

  role_id: { required: true, type: "number" }
}

const editUserSchema = {
 
  first_name: {  type: "string" },
  last_name: {  type: "string" }, 
  email: {
   
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
},
  phone_number: {
  
    type: "string",
    pattern: /^[0-9]{10}$/,
}, 
  role_id: {  type: "number" }
}

const roleSchema = {
         role_name : { required: true, type: "string" },
          description : { required: true, type: "string" },
          role_permissions : { required: true, type: "array", itemsType: "number" }
}

  module.exports = {
    userLoginAndFPSchema,
    changePasswordSchema,
    orgSchema,
    userSchema,
    editUserSchema,
    roleSchema
  }