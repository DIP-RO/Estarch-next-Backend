// routes/categoryRoutes.js
import { Router } from 'express';
import {
    createCategory,
    createSubCategory,
    getCategoriesWithSubCategories,
    updateCategory,
    updateSubCategory,
    deleteCategory,
    deleteSubCategory,
    getSubCategories,
    fetchSubCategories,
    createBrand,
    getBrands,
    updateBrand,
    deleteBrand
} from '../controllers/categoryController.js';

const router = Router();

router.post('/categories', createCategory);
router.post('/subcategories', createSubCategory);
router.get('/subcategories', getSubCategories);
router.get('/categories', getCategoriesWithSubCategories);
router.get('/subcategories/:categoryId', fetchSubCategories); 
router.put('/categories/:id', updateCategory);
router.put('/subcategories/:id', updateSubCategory);
router.delete('/categories/:id', deleteCategory);
router.delete('/subcategories/:id', deleteSubCategory);
router.post('/brands', createBrand);
router.get('/brands', getBrands);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

export default router;
