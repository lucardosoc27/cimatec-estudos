package br.senai.cimatec.estudos.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * O Angular compilado é servido pelo próprio Spring, na mesma origem que a API (DECISOES.md,
 * 2026-09-27, "Topologia de produção"). No build, o Maven copia frontend/dist/frontend/browser
 * para static/ dentro do jar (pom.xml).
 *
 * Uma aplicação Angular tem UM arquivo HTML, o index.html; as "páginas" (/mentores, /pedidos/1)
 * são rotas que só existem dentro do navegador. Quem abre uma dessas rotas direto, ou aperta F5
 * nela, pede ao servidor um arquivo que não existe. Sem esta classe a resposta seria 404. Com ela,
 * o servidor devolve o index.html, o Angular sobe e mostra a rota certa.
 *
 * Regras do fallback, para não atropelar o resto:
 * - arquivo que existe em static/ é servido como sempre (index.html, main-xxxx.js, assets/...);
 * - caminho que começa com api/ nunca cai no index: rota de API que não existe responde 404
 *   (e, sem login, 401 antes disso, pelo SecurityConfig);
 * - caminho com extensão (imagem que não existe, .js de versão antiga) responde 404, para um
 *   erro de arquivo não virar uma página HTML com status 200;
 * - a página de erro (/error) tem controller próprio, que vem antes dos arquivos estáticos.
 *
 * O mapeamento padrão do Boot para /** é desligado em application.properties
 * (spring.web.resources.add-mappings=false), para existir um só, este.
 */
@Configuration
public class RotasDoAngular implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            // false = sem cache de "caminho pedido -> arquivo". Com o fallback, cada caminho
            // inventado por alguém viraria uma entrada nova nesse cache, sem teto.
            .resourceChain(false)
            .addResolver(new PathResourceResolver() {
                @Override
                protected Resource getResource(String caminho, Resource pasta) throws IOException {
                    // O super confere que o arquivo existe e que está dentro de static/ (nada de ../).
                    Resource arquivo = super.getResource(caminho, pasta);
                    if (arquivo != null) {
                        return arquivo;
                    }
                    return ehRotaDoAngular(caminho) ? super.getResource("index.html", pasta) : null;
                }
            });
    }

    /** Caminho sem extensão e fora de /api: é uma rota do Angular, e o index.html responde por ela. */
    static boolean ehRotaDoAngular(String caminho) {
        if (caminho.equals("api") || caminho.startsWith("api/")) {
            return false;
        }
        String ultimoTrecho = caminho.substring(caminho.lastIndexOf('/') + 1);
        return !ultimoTrecho.contains(".");
    }
}
