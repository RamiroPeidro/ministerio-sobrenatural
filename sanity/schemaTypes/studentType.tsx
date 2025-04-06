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
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "Student", value: "student" },
          { title: "Admin", value: "admin" },
          { title: "Super Admin", value: "superadmin" },
        ],
        layout: "radio",
      },
      initialValue: "student",
      description: "Role of the user in the system",
    }),
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      readOnly: true,
      description: "Generated automatically from first and last name",
    }),
    defineField({
      name: "username",
      title: "Username",
      type: "slug",
      options: {
        source: "fullName",
        maxLength: 96,
      },
    }),
  ],
  preview: {
    select: {
      firstName: "firstName",
      lastName: "lastName",
      imageUrl: "imageUrl",
      role: "role",
    },
    prepare({ firstName, lastName, imageUrl, role }) {
      return {
        title: `${firstName?.charAt(0).toUpperCase() || ""}${firstName?.slice(1) || ""} ${lastName?.charAt(0).toUpperCase() || ""}${lastName?.slice(1) || ""}`,
        subtitle: role ? `Role: ${role}` : "Student",
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
