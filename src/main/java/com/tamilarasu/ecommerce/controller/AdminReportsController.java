package com.tamilarasu.ecommerce.controller;

import com.tamilarasu.ecommerce.entity.Report;
import com.tamilarasu.ecommerce.repository.ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReportsController {

    private final ReportRepository reportRepository;

    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportRepository.findAllByOrderByReportDateDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Report> getReport(@PathVariable Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));
        return ResponseEntity.ok(report);
    }
}
