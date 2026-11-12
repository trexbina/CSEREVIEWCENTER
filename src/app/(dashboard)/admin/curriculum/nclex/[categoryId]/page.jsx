import { notFound } from "next/navigation"
import pool from "@/lib/db"
import CurriculumManagerPage from "../../page"

export default async function NclexCurriculumCategoryPage({ params }) {
    const { categoryId } = await params
    const id = Number(categoryId)

    if (!Number.isInteger(id) || id <= 0) notFound()

    const { rows } = await pool.query(
        `SELECT categories.id, categories.exam_id
         FROM categories
         INNER JOIN examinations ON examinations.id = categories.exam_id
         WHERE categories.id = $1 AND LOWER(examinations.name) LIKE '%nclex%'`,
        [id]
    )

    const category = rows[0]
    if (!category) notFound()

    return <CurriculumManagerPage initialExamId={String(category.exam_id)} initialCategoryId={String(category.id)} />
}
