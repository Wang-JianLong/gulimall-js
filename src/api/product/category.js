import request from '../../utils/httpRequest'
export function deleteCategorys(ids = []) {
    return request({
        url: request.adornUrl('/product/category/delete'),
        method: 'post',
        data: request.adornData(ids)
    })
}


export function saveCategory({ catId, name, parentName, catLevel, parentCid, showStatus, sort, icon, productUnit }) {
    return request({
        method: 'post',
        url: request.adornUrl('/product/category/save'),
        data: request.adornData({ catId, name, parentName, catLevel, parentCid, showStatus, sort, icon, productUnit })
    })
}

// /product/category/update
export function updateCategory({ catId, name, icon, productUnit }) {
    return request({
        method: 'post',
        url: request.adornUrl('/product/category/update'),
        data: request.adornData({ name, catId, icon, productUnit })
    })
}


export function getCategoryInfo(catId) {
    return request({
        method: 'get',
        url: request.adornUrl(`/product/category/info/${catId}`)
    })
}


export function updateSort(data) {
    return request({
        method: 'post',
        url: request.adornUrl('/product/category/update/sort'),
        data: request.adornData(data,false)
    })
}


export function deleteByIds(data) {
    return request({
        method: 'post',
        url: request.adornUrl('/product/category/delete'),
        data: request.adornData(data,false)
    })
}
