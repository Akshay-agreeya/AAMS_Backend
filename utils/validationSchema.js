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
    org_type_id: { required: true },
    industry_id: { required: true },
    address_line: { required: true, type: "string" },
    city: { required: false, type: "string" },
    state: { required: true, type: "string" },
    zip_code: { required: false, type: "string" },
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

  role_id: { required: true}
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
}
}

const roleSchema = {
         role_name : { required: true, type: "string" },
          description : { required: true, type: "string" },
          role_permissions : { required: true, type: "array", itemsType: "number" }
}

const productSchema ={
  web_url :{required : true, type: "string", 
  pattern: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/},
  other_details :{
    type : "string"
  },
  scan_day_ids:{required: true, type: "string"}
}

  module.exports = {
    userLoginAndFPSchema,
    changePasswordSchema,
    orgSchema,
    userSchema,
    editUserSchema,
    roleSchema,
    productSchema
  }