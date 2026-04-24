package com.cmp.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileService {

    @Value("${app.upload-dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) {

        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            // 🔥 Validate type (optional but recommended)
            if (!file.getContentType().equals("application/pdf")) {
                throw new RuntimeException("Only PDF files are allowed");
            }

            // 🔥 Unique file name (avoid overwrite)
            String originalName = file.getOriginalFilename() == null ? "document.pdf" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = System.currentTimeMillis() + "_" + originalName;

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = uploadPath.resolve(fileName);

            // create folder if not exists
            Files.createDirectories(path.getParent());

            // save file
            Files.write(path, file.getBytes());

            // return accessible URL
            return "/uploads/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("File upload failed", e);
        }
    }
}
