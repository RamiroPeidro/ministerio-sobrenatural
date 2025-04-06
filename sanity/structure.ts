import { StructureBuilder } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Admin Dashboard")
    .items([
      // Course Content
      S.listItem()
        .title("Course Content")
        .child(
          S.documentTypeList("course")
            .title("Courses")
            .child((courseId) =>
              S.list()
                .title("Course Options")
                .items([
                  // Option to edit course content
                  S.listItem()
                    .title("Edit Course Content")
                    .child(
                      S.document().schemaType("course").documentId(courseId)
                    ),
                  // Option to view course enrollments
                  S.listItem()
                    .title("View Students")
                    .child(
                      S.documentList()
                        .title("Course Enrollments")
                        .filter(
                          '_type == "enrollment" && course._ref == $courseId'
                        )
                        .params({ courseId })
                    ),
                ])
            )
        ),

      S.divider(),

      // Users
      S.listItem()
        .title("User Management")
        .child(
          S.list()
            .title("Select a Type of User")
            .items([
              // Instructors with options
              S.listItem()
                .title("Instructors")
                .schemaType("instructor")
                .child(
                  S.documentTypeList("instructor")
                    .title("Instructors")
                    .child((instructorId) =>
                      S.list()
                        .title("Instructor Options")
                        .items([
                          // Option to edit instructor details
                          S.listItem()
                            .title("Edit Instructor Details")
                            .child(
                              S.document()
                                .schemaType("instructor")
                                .documentId(instructorId)
                            ),
                          // Option to view instructor's courses
                          S.listItem()
                            .title("View Courses")
                            .child(
                              S.documentList()
                                .title("Instructor's Courses")
                                .filter(
                                  '_type == "course" && instructor._ref == $instructorId'
                                )
                                .params({ instructorId })
                            ),
                        ])
                    )
                ),
              // Students with options
              S.listItem()
                .title("Students")
                .schemaType("student")
                .child(
                  S.documentTypeList("student")
                    .title("Students")
                    .child((studentId) =>
                      S.list()
                        .title("Student Options")
                        .items([
                          // Option to edit student details
                          S.listItem()
                            .title("Edit Student Details")
                            .child(
                              S.document()
                                .schemaType("student")
                                .documentId(studentId)
                            ),
                          // Option to view enrollments
                          S.listItem()
                            .title("View Enrollments")
                            .child(
                              S.documentList()
                                .title("Student Enrollments")
                                .filter(
                                  '_type == "enrollment" && student._ref == $studentId'
                                )
                                .params({ studentId })
                            ),
                          // Option to view completed lessons
                          S.listItem()
                            .title("View Completed Lessons")
                            .child(
                              S.documentList()
                                .title("Completed Lessons")
                                .schemaType("lessonCompletion")
                                .filter(
                                  '_type == "lessonCompletion" && student._ref == $studentId'
                                )
                                .params({ studentId })
                                .defaultOrdering([
                                  { field: "completedAt", direction: "desc" },
                                ])
                            ),
                        ])
                    )
                ),
            ])
        ),

      S.divider(),

      // System Management
      S.listItem()
        .title("System Management")
        .child(
          S.list()
            .title("System Management")
            .items([
              S.documentTypeListItem("category").title("Categories"),
              
              // Meetings (Reuniones)
              S.listItem()
                .title("Reuniones")
                .schemaType("meeting")
                .child(
                  S.list()
                    .title("Reuniones")
                    .items([
                      // Todas las reuniones
                      S.listItem()
                        .title('Todas las Reuniones')
                        .child(
                          S.documentTypeList('meeting')
                            .title('Todas las Reuniones')
                            .defaultOrdering([{ field: 'date', direction: 'asc' }])
                        ),
                      
                      // Por Estado
                      S.listItem()
                        .title('Por Estado')
                        .child(
                          S.list()
                            .title('Por Estado')
                            .items([
                              S.listItem()
                                .title('Programadas')
                                .child(
                                  S.documentList()
                                    .title('Reuniones Programadas')
                                    .filter('_type == "meeting" && status == "scheduled"')
                                    .defaultOrdering([{ field: 'date', direction: 'asc' }])
                                ),
                              S.listItem()
                                .title('En Curso')
                                .child(
                                  S.documentList()
                                    .title('Reuniones En Curso')
                                    .filter('_type == "meeting" && status == "in-progress"')
                                    .defaultOrdering([{ field: 'date', direction: 'asc' }])
                                ),
                              S.listItem()
                                .title('Finalizadas')
                                .child(
                                  S.documentList()
                                    .title('Reuniones Finalizadas')
                                    .filter('_type == "meeting" && status == "completed"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                            ])
                        ),
                      
                      // Por Categoría (poblado dinámicamente)
                      S.listItem()
                        .title('Por Categoría')
                        .child(
                          // Consultar categorías existentes
                          S.documentTypeList('category')
                            .title('Seleccionar Categoría')
                            .child(categoryId => 
                              S.documentList()
                                .title('Reuniones de la Categoría')
                                .filter('_type == "meeting" && category._ref == $categoryId')
                                .params({ categoryId })
                                .defaultOrdering([{ field: 'date', direction: 'asc' }])
                            )
                        ),

                      // Por Tipo
                      S.listItem()
                        .title('Por Tipo')
                        .child(
                          S.list()
                            .title('Por Tipo')
                            .items([
                              S.listItem()
                                .title('Virtuales')
                                .child(
                                  S.documentList()
                                    .title('Reuniones Virtuales')
                                    .filter('_type == "meeting" && isVirtual == true')
                                    .defaultOrdering([{ field: 'date', direction: 'asc' }])
                                ),
                              S.listItem()
                                .title('Presenciales')
                                .child(
                                  S.documentList()
                                    .title('Reuniones Presenciales')
                                    .filter('_type == "meeting" && isVirtual == false')
                                    .defaultOrdering([{ field: 'date', direction: 'asc' }])
                                ),
                            ])
                        ),
                    ])
                ),
              
              // Attendance Records
              S.listItem()
                .title("Attendance Records")
                .schemaType("attendance")
                .child(
                  S.list()
                    .title("Attendance Records")
                    .items([
                      // Todos los registros de asistencia
                      S.listItem()
                        .title('Todos los Registros')
                        .child(
                          S.documentTypeList('attendance')
                            .title('Todos los Registros de Asistencia')
                            .defaultOrdering([{ field: 'date', direction: 'desc' }])
                        ),
                      
                      // Por Reunión
                      S.listItem()
                        .title('Por Reunión')
                        .child(
                          // Consultar reuniones
                          S.documentTypeList('meeting')
                            .title('Seleccionar Reunión')
                            .child(meetingId => 
                              S.documentList()
                                .title('Asistencia a la Reunión')
                                .filter('_type == "attendance" && meeting._ref == $meetingId')
                                .params({ meetingId })
                                .defaultOrdering([{ field: 'date', direction: 'desc' }])
                            )
                        ),
                      
                      // Por Categoría
                      S.listItem()
                        .title('Por Categoría')
                        .child(
                          // Consultar categorías
                          S.documentTypeList('category')
                            .title('Seleccionar Categoría')
                            .child(categoryId => 
                              S.documentList()
                                .title('Asistencia por Categoría')
                                .filter('_type == "attendance" && category._ref == $categoryId')
                                .params({ categoryId })
                                .defaultOrdering([{ field: 'date', direction: 'desc' }])
                            )
                        ),
                      
                      // Por Estudiante
                      S.listItem()
                        .title('Por Estudiante')
                        .child(
                          // Consultar estudiantes
                          S.documentTypeList('student')
                            .title('Seleccionar Estudiante')
                            .child(studentId => 
                              S.documentList()
                                .title('Asistencia del Estudiante')
                                .filter('_type == "attendance" && student._ref == $studentId')
                                .params({ studentId })
                                .defaultOrdering([{ field: 'date', direction: 'desc' }])
                            )
                        ),
                    ])
                ),
            ])
        ),
    ]);
