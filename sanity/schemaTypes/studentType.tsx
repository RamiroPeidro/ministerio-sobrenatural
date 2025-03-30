import Image from "next/image";
import { defineField, defineType } from "sanity";

export const studentType = defineType({
  name: "student",
  title: "Student",
  type: "document",
  fields: [
    defineField({
      name: "firstName",
      title: "First Name",
      type: "string",
    }),
    defineField({
      name: "lastName",
      title: "Last Name",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clerkId",
      title: "Clerk User ID",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "imageUrl",
      title: "Profile Image URL",
      type: "url",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      description: "The category to which this student belongs",
    }),
  ],
  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      imageUrl: "imageUrl",
    },
    prepare({ firstName, lastName, imageUrl }) {
      return {
        title: `${firstName?.charAt(0).toUpperCase() || ""}${firstName?.slice(1) || ""} ${lastName?.charAt(0).toUpperCase() || ""}${lastName?.slice(1) || ""}`,
        media: (
          <Image
            src={imageUrl}
            alt={`${firstName || ""} ${lastName || ""}`}
            width={100}
            height={100}
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
        ),
      };
    },
  },
});
