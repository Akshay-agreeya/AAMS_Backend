//  exports.getDatawithPagination = (result) =>{
// return {data:result?.[0],pagination:{...result[1]}};
// }

exports.getDatawithPagination = (result) => {
    const pagenation = result?.[1]?.[0] || {};
    const data = result?.[0] || [];
    return {
        contents: [...data],
        ...pagenation
    };
};


