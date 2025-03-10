//  exports.getDatawithPagination = (result) =>{
// return {data:result?.[0],pagination:{...result[1]}};
// }

exports.getDatawithPagination = (result) => {
    return {
        data: result?.[0], 
        pagination: result?.[1]?.[0] || {} 
    };
};
