<!--
    1. 最后一级菜单无法追加节点 且只有没有子数据的节点可以删除
    2. 点击删除弹出对话框
    3. 删除发送数据 刷新页面 展开被删除节点的父节点
    4. 新增 - 模型数据记录（当前节点名称，所属父节点id...）
    5. 调用接口添加数据 清空模型数据 关闭对话框
 -->
<template>
    <div>
        <div style="display: flex;justify-content: space-between">
            <el-switch style="margin-left: 20px;" v-model="startDrag" active-text="开启拖拽" inactive-text="关闭拖拽"> </el-switch>
            <div>
                <el-button type="primary" @click="uploadSort" style="margin-bottom: 20px;"
                    :disabled="!updateNodes.length">点击上传拖拽分类</el-button>
                <el-button @click="batchDelete" style="margin-bottom: 20px;" type="danger">批量删除</el-button>
            </div>

        </div>
        <el-tree :draggable="startDrag" :allow-drop="allowDrop" :allow-drag="allowDrag" @node-drop="handleDrop"
            :data="menus" :props="defaultProps" show-checkbox :expand-on-click-node="false" node-key="catId"
            :default-expanded-keys="exdpandeKey" ref="menuTree">
            <!-- 绑定动态展开的数组 -->
            <span class="custom-tree-node" slot-scope="{ node, data }">
                <span>{{ node.label }}</span>
                <span>
                    <!-- 当没有子节点式才显示追加节点 -->
                    <el-button type="text" v-if="node.level <= 2" size="mini" @click="() => append(data)">
                        Append
                    </el-button>
                    <el-button type="text" size="mini" @click="() => edit(data)">
                        Update
                    </el-button>
                    <el-button type="text" v-if="!data.children.length" size="mini" @click="() => open(node, data)">
                        Delete
                    </el-button>
                </span>
            </span>
        </el-tree>

        <!-- 添加节点 dialog -->
        <el-dialog :title="title" :visible.sync="dialogVisible" width="30%" :before-close="handleClose"
            :close-on-click-modal="false">
            <span v-if="form.catLevel">请输入要添加的{{ this.form.catLevel }}级分类</span>
            <el-form :model="form">
                <el-form-item label="分类名称">
                    <el-input v-model="form.name" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="图标">
                    <el-input v-model="form.icon" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="计量单位">
                    <el-input v-model="form.productUnit" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="所属父级" v-if="form.parentName">
                    <el-input v-model="form.parentName" autocomplete="off" disabled></el-input>
                </el-form-item>
            </el-form><span slot="footer" class="dialog-footer">
                <el-button @click="cancel">取 消</el-button>
                <el-button type="primary" @click="addOrUpdate">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>
<script>
import { deleteCategorys, saveCategory, updateCategory, getCategoryInfo, updateSort, deleteByIds } from '../../../api/product/category'
export default {
    data() {
        return {
            startDrag: false,
            updateNodes: [],
            maxLevel: 0,
            title: '',
            dialogType: '',
            form: {
                catId: null,
                name: '',
                parentName: '', // 附加数据
                catLevel: null,
                parentCid: null,
                showStatus: 1,
                productUnit: '',
                icon: '',
                sort: 0,
            },
            dialogVisible: false,
            exdpandeKey: [],
            menus: [],
            defaultProps: {
                children: 'children',
                label: 'name'
            }
        }
    },
    created() {
        this.getMenus();
    },
    methods: {
        // 获取所有节点
        getMenus() {
            this.$http({
                url: this.$http.adornUrl('/product/category/list/tree'),
                method: 'get'
            }).then((result) => {
                this.menus = result.data.data
            }).catch((err) => {
                console.log(err)
            });
        },
        // 删除节点
        remove(node, data) {
            let ids = [data.catId]
            deleteCategorys(ids).then(res => {
                this.$message({
                    type: 'success',
                    message: '删除成功!'
                });
                // 重新发送请求
                this.getMenus()
                // 取其中数据真正的id node.parent.id 不一定正确
                this.exdpandeKey = [node.parent.data.catId]
            }).catch(err => {
                this.$message({
                    type: 'error',
                    message: 'error 删除失败'
                })
            })
        },
        open(node, data) {
            this.$confirm(`此操作将永久删除【${data.name}】, 是否继续?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.remove(node, data)
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },

        addOrUpdate() {
            if (this.dialogType === 'add') {
                this.addCategory()
            } else if (this.dialogType === 'update') {
                this.update()
            }
        },
        // 添加节点 
        append(data) {
            this.title = '添加节点'
            this.dialogType = 'add'
            this.dialogVisible = true
            this.form.parentCid = data.catId
            this.form.parentName = data.name
            this.form.catLevel = data.catLevel + 1
            // console.log(data)
        },
        addCategory() {
            saveCategory(this.form)
                .then(res => {
                    this.$message({
                        type: 'success',
                        message: '添加成功'
                    })

                    //关闭对话框 清空数据 默认展开父级
                    // 在这里执行完成 因为这里是异步
                    let ekId = this.form.parentCid
                    this.form = { name: '', parentName: '', catLevel: null, parentCid: null, showStatus: 1, sort: 0, catId: null, icon: '', productUnit: '' }
                    this.dialogVisible = false
                    this.getMenus()
                    this.exdpandeKey = [ekId]
                })
                .catch(err => {
                    this.$message({
                        type: 'error',
                        message: '添加失败'
                    })
                    this.dialogVisible = false
                })
        },

        // 修改节点
        edit(data) {
            this.title = '修改节点'
            this.dialogVisible = true
            this.form.catId = data.catId
            this.dialogType = 'update'
            getCategoryInfo(data.catId).then(({ data }) => {
                this.form.name = data.data.name
                this.form.parentCid = data.data.parentCid
                this.form.icon = data.data.icon
                this.form.productUnit = data.data.productUnit
            })
        },

        update() {
            updateCategory(this.form)
                .then(res => {
                    this.$message({
                        type: 'success',
                        message: '修改成功'
                    })
                    let ek = this.form.parentCid
                    this.form = { name: '', parentName: '', catLevel: null, parentCid: null, showStatus: 1, sort: 0, catId: null, icon: '', productUnit: '' }
                    this.dialogVisible = false
                    this.getMenus()
                    this.exdpandeKey = [ek]
                })
        },
        cancel() {
            this.form = { name: '', parentName: '', catLevel: null, parentCid: null, showStatus: 1, sort: 0, catId: null }
            this.dialogVisible = false
        },
        handleClose() { },
        // 拖拽时判定目标节点能否被放置。
        // type 参数有三种情况：'prev'、'inner' 和 'next'，
        // 分别表示放置在目标节点前、插入至目标节点和放置在目标节点后
        allowDrop(draggingNode, dropNode, type) {
            // 初始化值 如果你想重复拖动的话
            this.maxLevel = draggingNode.level
            // 被拖动的当前节点的层数 加上 被拖动后的父节点所在的层级不能大于3
            // 1. 判断当前节点的总层数
            this.countNodeLevel(draggingNode)
            // 2. 当前节点的深度 + 正在拖动的目标父节点所有的层级 <= 3(当前环境下最大层级)
            // 当前节点深度 = 也就是最大层级 - 当前层级 + 1(节点自身的一层深度)

            // 所占用的层级 = 最大层级（3） - 当前节点（2级节点/里面有2层 两层参与计算） + 自身一层 
            // 所占用的层级 + 目标层级  不能大于 最大层级
            let deep = this.maxLevel - draggingNode.level + 1
            //console.log(deep)
            if (type == 'inner') {
                return (deep + dropNode.level) <= 3 // 父子关系
            } else {
                return (deep + dropNode.parent.level) <= 3 // 兄弟关系
            }
        },

        // 判断节点能否被拖拽
        allowDrag(draggingNode) {
            // console.log(draggingNode)
            return true;
        },

        // 注意 这里使用 动态的level 不然不会实时 只会按照数据库中
        countNodeLevel(currentNode) {
            // 找出所有子节点 获取最大深度
            if (currentNode.childNodes && currentNode.childNodes.length > 0) {
                for (let i = 0; i < currentNode.childNodes.length; i++) {
                    if (currentNode.childNodes[i].level > this.maxLevel) {
                        this.maxLevel = currentNode.childNodes[i].level
                    }
                    // 判断当前节点的有没有子节点
                    this.countNodeLevel(currentNode.childNodes[i])
                }
            }
        },

        // 拖拽成功的事件回调函数 当前节点 目标节点 after/before/inner 时间对象
        handleDrop(draggingNode, dropNode, dropType, ev) {
            // console.log(dropType)
            // 1.当前节点的最新父节点id
            const current = draggingNode.data
            let parentCid;
            let siblings = null;
            if (dropType == 'inner') {
                // 进入目标节点的话 那么此节点就是当前节点的父节点
                parentCid = dropNode.data.catId
                // 父节点的所有子节点
                siblings = dropNode.childNodes
            } else {
                // 兄弟节点的父节点就是当前节点的父节点  // 未定义表示当前目标位置是根节点了
                parentCid = dropNode.parent.data.catId == undefined ? 0 : dropNode.parent.data.catId
                // 兄弟节点的父节点的所有子节点
                // 如果是根节点 那么根节点的 父节点data会变为数组
                siblings = dropNode.parent.childNodes
            }

            // level 真实所处的层级
            // 2.当前节点的最新顺序
            for (let i = 0; i < siblings.length; i++) {
                // if: 对于被拖拽的节点的处理
                if (siblings[i].data.catId === draggingNode.data.catId) {
                    let catLevel = draggingNode.level;
                    // 如果层级改变
                    if (siblings[i].level != draggingNode.level) {
                        catLevel = siblings[i].level
                        this.updateChlidNodeLevel(siblings[i])
                    }
                    this.updateNodes.push({ catId: siblings[i].data.catId, sort: i, parentCid, catLevel })
                } else {
                    this.updateNodes.push({ catId: siblings[i].data.catId, sort: i })
                }
            }
            // console.log('ok')
            // console.log(JSON.stringify(this.updateNodes))
        },
        updateChlidNodeLevel(node) {
            if (node.childNodes && node.childNodes.length > 0) {
                let childNodes = node.childNodes
                for (let i = 0; i < childNodes.length; i++) {
                    let vNode = childNodes[i].data
                    this.updateNodes.push({ catId: vNode.catId, catLevel: childNodes[i].level })
                    this.updateChlidNodeLevel(childNodes[i])
                }
            }
        },
        uploadSort() {
            this.exdpandeKey = this.updateNodes.filter(v => v.parentCid).map(v => v.parentCid)
            console.log(this.updateNodes)
            updateSort(this.updateNodes).then(res => {
                this.$message({
                    type: 'success',
                    message: '更新成功'
                })
                this.getMenus()
                this.updateNodes = []
                this.maxLevel = 0
            })
        },
        // 批量删除
        batchDelete() {
            const checkedNodes = this.$refs.menuTree.getCheckedNodes()
            // console.log(checkedNodes)
            const names = checkedNodes.map(v => '【' +v.name +'】').join(', ')
            this.$confirm(`是否批量删除[${names}] ?`, {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warring'
            })
                .then(() => {
                    const ids = checkedNodes.map(v => v.catId)
                    deleteByIds(ids).then(() => {
                        this.$message.success('删除成功')
                    })
                    this.getMenus()

                }).catch(() => {

                })
        }
    },

}


</script>

<style scoped>
/* .el-tree span span button  {
    margin-left: 100px;
} */
</style>