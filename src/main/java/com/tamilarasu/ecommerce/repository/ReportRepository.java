package com.tamilarasu.ecommerce.repository;

import com.tamilarasu.ecommerce.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Optional<Report> findByReportDate(LocalDate reportDate);

    List<Report> findAllByOrderByReportDateDesc();
}
