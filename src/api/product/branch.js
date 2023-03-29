import request from '../../utils/httpRequest'

/**
 * 修改状态
 * @param {*} param0  值
 * @returns requst
 */
export function updateStatus({ brandId, showStatus }) {
    return request({
        url: request.adornUrl('/product/brand/update'),
        method: 'post',
        data: request.adornData({ brandId, showStatus }, false)
    })
}