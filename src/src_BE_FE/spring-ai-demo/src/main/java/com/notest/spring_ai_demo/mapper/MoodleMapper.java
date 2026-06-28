package com.notest.spring_ai_demo.mapper;

import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentDTO;
import org.mapstruct.Mapper;

// Giả sử class chứa dữ liệu trong AssignmentCourseResponse của bạn tên là Assignment
// Bạn hãy import đúng package của class đó vào đây
//import com.notest.spring_ai_demo.dto.moodle.assignment.AssignmentCourseResponse.Assignment;

@Mapper(componentModel = "spring")
public interface MoodleMapper {

    AssignmentDTO toAssignmentDTO(AssignmentDTO assign);
}
