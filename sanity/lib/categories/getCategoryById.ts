import { client } from "../client";

export async function getCategoryById(categoryId: string) {
  const category = await client.fetch(
    `*[_type == "category" && _id == $categoryId][0]{
      _id,
      name,
      description,
      "slug": slug.current,
      zoomLink,
      zoomPassword
    }`,
    { categoryId }
  );

  return category;
}
